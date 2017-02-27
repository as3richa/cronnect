require "./lobby.cr"

module Cronnect
  class MainLobby < Lobby
    MAX_NICKNAME_LENGTH = 16
    NICKNAME_REGEX = /^([a-zA-Z0-9_\-]){1,#{MAX_NICKNAME_LENGTH}}$/

    def initialize
      super

      @players = {} of String => Player
      @challenges = {} of Player => Player

      @dispatch_table = {
        new: ->(player : Player, nothing : RequestParameter) {
          player.state = :unidentified
          player.outgoing_pipe.send({
            command: "HELLO",
            success: true,
            message: "Please choose a nickname"
          })
          nil
        },

        nickname: ->(player : Player, nickname_param : RequestParameter) {
          nickname = nickname_param.to_s
          normalized_nickname = nickname.downcase

          if player.state == :unidentified
            if NICKNAME_REGEX === nickname
              if !@players.has_key?(normalized_nickname)
                @players[normalized_nickname] = player

                player.nickname = nickname
                player.state = :waiting

                player.outgoing_pipe.send({
                  command: "NICKNAME",
                  success: true,
                  nickname: nickname,
                  message: "You are now known as #{nickname}"
                })
              else
                player.outgoing_pipe.send({
                  command: "NICKNAME",
                  success: false,
                  nickname: nickname,
                  message: "Nickname #{nickname} is already in use; please try another"
                })
              end
            else
              player.outgoing_pipe.send({
                command: "NICKNAME",
                success: false,
                nickname: nickname,
                message: "Nickname may contain only letters, numbers, dashes, and underscores, and must be 1-#{MAX_NICKNAME_LENGTH} characters"
              })
            end
          else
            player.outgoing_pipe.send({
              command: "NICKNAME",
              success: false,
              nickname: nickname,
              message: "You have already identified as #{player.nickname}"
            })
          end

          nil
        },

        challenge: ->(player : Player, target_param : RequestParameter) {
          target_name = target_param.to_s
          target_normalized_name = target_name.downcase

          if !@challenges.has_key?(player)
            if @players.has_key?(target_normalized_name)
              target = @players[target_normalized_name]
              if player != target
                if target.state == :waiting
                  @challenges[player] = target
                  @challenges[target] = player

                  player.state = :challenging
                  target.state = :challenged

                  player.outgoing_pipe.send({
                    command: "CHALLENGE",
                    success: true,
                    target: target_name,
                    message: "You have issued a challenge to #{target_name}"
                  })

                  target.outgoing_pipe.send({
                    command: "CHALLENGED",
                    success: true,
                    challenger: player.nickname,
                    message: "You have been challenged by #{player.nickname}"
                  })
                else
                  reason = case target.state
                  when :challenging
                    "issuing a challenge"
                  when :challenged
                    "considering a challenge"
                  when :playing
                    "playing a game"
                  else
                    "busy"
                  end

                  player.outgoing_pipe.send({
                    command: "CHALLENGE",
                    success: false,
                    target: target_name,
                    message: "#{target_name} is already #{reason}"
                  })
                end
              else
                player.outgoing_pipe.send({
                  command: "CHALLENGE",
                  success: false,
                  target: target_name,
                  message: "You cannot challenge yourself"
                })
              end
            else
              player.outgoing_pipe.send({
                command: "CHALLENGE",
                success: false,
                target: target_name,
                message: "No such opponent #{target_name}"
              })
            end
          else
            player.outgoing_pipe.send({
              command: "CHALLENGE",
              success: false,
              target: target_name,
              message: "You are already issuing or considering a challenge"
            })
          end

          nil
        },

        accept: ->(player : Player, nothing : RequestParameter) {
          if player.state == :challenged
            challenger = @challenges[player]
            @challenges.delete(player)
            @challenges.delete(challenger)

            player.state = :playing
            challenger.state = :playing

            player.outgoing_pipe.send({
              command: "ACCEPT",
              success: true,
              message: "You have accepted #{challenger.nickname}'s challenge"
            })

            challenger.outgoing_pipe.send({
              command: "ACCEPT",
              success: true,
              message: "#{player.nickname} has accepted your challenge"
            })

            spawn_game_lobby(challenger, player)
          else
            player.outgoing_pipe.send({
              command: "ACCEPT",
              success: false,
              message: "You are not currently considering a challenge"
            })
          end

          nil
        },

        cancel: ->(player : Player, nothing : RequestParameter) {
          if player.state == :challenging || player.state == :challenged
            if player.state == :challenging
              challenger = player
              challengee = @challenges[player]
            else
              challenger = @challenges[player]
              challengee = player
            end

            @challenges.delete(challenger)
            @challenges.delete(challengee)

            challenger.state = :waiting
            challengee.state = :waiting

            challenger.outgoing_pipe.send({
              command: "CANCEL",
              success: true,
              message: "Your challenge to #{challengee.nickname} has been #{(player == challenger) ? "canceled" : "declined"}"
            })

            challengee.outgoing_pipe.send({
              command: "CANCEL",
              success: true,
              message: (player == challenger) ?
                "#{challenger.nickname} has cancelled their challenge" :
                "You have declined #{challenger.nickname}'s challenge"
            })
          else
            player.outgoing_pipe.send({
              command: "CANCEL",
              success: false,
              message: "You are not currently considering a challenge"
            })
          end

          nil
        },

        quit: ->(player : Player, nothing : RequestParameter) {
          @players.delete(player.nickname.downcase)
          if @challenges.has_key?(player)
            if player.state == :challenging
              challenger = player
              challengee = @challenges[player]
            else
              challenger = @challenges[player]
              challengee = player
            end

            challenger.outgoing_pipe.send({
              command: "CANCEL",
              success: true,
              message: (player == challenger) ?
                "You have quit; your challenge has been cancelled" :
                "#{player.nickname} has quit; your challenge has been cancelled"
            })

            challengee.outgoing_pipe.send({
              command: "CANCEL",
              success: true,
              message: (player == challengee) ?
                "You have quit; your challenge has been cancelled" :
                "#{player.nickname} has quit; their challenge has been cancelled"
            })

            @challenges.delete(challenger)
            @challenges.delete(challengee)

            challenger.state = :waiting
            challengee.state = :waiting
          end
          nil
        }
      }.to_h
    end

    def spawn_game_lobby(challenger, challengee)
      spawn do
        GameLobby.new(self, challenger, challengee).run
      end
    end
  end
end
