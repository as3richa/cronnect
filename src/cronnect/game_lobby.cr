require "./lobby.cr"

module Cronnect
  class GameLobby < Lobby
    GRID_WIDTH = 7
    GRID_HEIGHT = 6

    def initialize(@parent : Lobby, @player1 : Player, @player2 : Player)
      super()

      @turn = 1
      @game_count = 0

      @grid = Array(Array(Int32)).new
      @grid = (1..GRID_WIDTH).map { (1..GRID_HEIGHT).map { 0 } }

      @dispatch_table = {
        drop: ->(player : Player, column_param : RequestParameter) {
          column = column_param.to_s.to_i

          if ((player == @player1) ? 1 : 2) == @turn
            if (0...GRID_WIDTH).includes?(column)
              if @grid[column][0] == 0
                row = (0...GRID_HEIGHT).take_while { |r| @grid[column][r] == 0 }.last
                @grid[column][row] = @turn

                [@player1, @player2].each do |player|
                  player.outgoing_pipe.send({
                    command: "DROP",
                    success: true,
                    column: column,
                    player: @turn,
                    message: "Dropped on column #{column}"
                  })
                end

                possible_win = check_for_wins
                if possible_win[:winner] != 0
                  [@player1, @player2].each do |player|
                    player.outgoing_pipe.send({
                      command: "WIN",
                      success: true,
                      winner: possible_win[:winner],
                      grid: possible_win[:grid],
                      message: "Game was won"
                    })
                  end

                  @grid = (1..GRID_WIDTH).map { (1..GRID_HEIGHT).map { 0 } }
                  @game_count += 1
                  @turn = 1 + @game_count % 2
                else
                  @turn = (@turn == 1) ? 2 : 1
                end
              else
                player.outgoing_pipe.send({
                  command: "DROP",
                  success: false,
                  column: column,
                  player: @turn,
                  message: "Column #{column} is full"
                })
              end
            else
              player.outgoing_pipe.send({
                command: "DROP",
                success: false,
                column: column,
                player: @turn,
                message: "Column out of range"
              })
            end
          else
            player.outgoing_pipe.send({
              command: "DROP",
              success: false,
              column: column,
              player: (@turn == 1) ? 2 : 1,
              message: "It is not your turn"
            })
          end

          nil
        },

        leave: ->(player : Player, nothing : RequestParameter) {
          other = (player == @player1) ? @player2 : @player1

          player.state = :waiting
          other.state = :waiting

          player.lobby = @parent
          other.lobby = @parent

          player.outgoing_pipe.send({
            command: "LEAVE",
            success: true,
            message: "You have left the game"
          })

          other.outgoing_pipe.send({
            command: "LEAVE",
            success: true,
            message: "#{player.nickname} has left the game"
          })

          self.terminate
          nil
        },

        quit: ->(player : Player, nothing : RequestParameter) {
          @dispatch_table[:leave].call(player, nil)
          player.run_command(:quit, nil)
          nil
        }
      }.to_h

      @player1.lobby = self
      @player2.lobby = self
    end

    def check_for_wins
      winner = 0
      win_grid = (0...GRID_WIDTH).map { (0...GRID_HEIGHT).map { false } }

      (0...GRID_WIDTH).each do |column|
        (0...GRID_HEIGHT).each do |row|
          next if @grid[column][row] == 0

          if column + 4 <= GRID_WIDTH && (0...4).all? { |c| @grid[column][row] == @grid[column + c][row] }
            winner = @grid[column][row]
            (0...99).take_while { |c| column + c < GRID_WIDTH && @grid[column][row] == @grid[column + c][row] }.each do |c|
              win_grid[column + c][row] = true
            end
          end

          if row + 4 <= GRID_HEIGHT && (0...4).all? { |r| @grid[column][row] == @grid[column][row + r] }
            winner = @grid[column][row]
            (0...99).take_while { |r| row + r < GRID_HEIGHT && @grid[column][row] == @grid[column][row + r] }.each do |r|
              win_grid[column][row + r] = true
            end
          end

          if (column + 4 <= GRID_WIDTH && row + 4 <= GRID_HEIGHT &&
            (0...4).all? { |i| @grid[column][row] == @grid[column + i][row + i] })
            winner = @grid[column][row]
            (0..99).take_while { |i|
              column + i < GRID_WIDTH && row + i < GRID_HEIGHT && @grid[column][row] == @grid[column + i][row + i]
            }.each do |i|
              win_grid[column + i][row + i] = true
            end
          end

          if (column + 4 <= GRID_WIDTH && row - 4 >= -1 &&
            (0...4).all? { |i| @grid[column][row] == @grid[column + i][row - i] })
            winner = @grid[column][row]
            (0..99).take_while { |i|
              column + i < GRID_WIDTH && row - i >= 0 && @grid[column][row] == @grid[column + i][row - i]
            }.each do |i|
              win_grid[column + i][row - i] = true
            end
          end
        end
      end

      {
        winner: winner,
        grid: win_grid
      }
    end
  end
end
