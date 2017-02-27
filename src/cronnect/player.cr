module Cronnect
  class Player
    VALID_STATES = Set(Symbol).new([:unidentified, :waiting, :challenging, :challenged, :playing])

    getter :outgoing_pipe

    getter :nickname
    setter :nickname

    getter :state
    setter :state

    getter :lobby
    setter :lobby

    def initialize(@lobby : Lobby)
      @outgoing_pipe = Channel(Lobby::Response).new(BUFFERING)

      @nickname = "!"
      @state = :none

      @lobby.incoming_pipe.send({
        command: :new,
        player: self,
        parameter: nil})
    end

    def run_command(command : Symbol, parameter : Lobby::RequestParameter)
      raise ArgumentError.new("unknown command #{command.to_s}") unless @lobby.accepts?(command)
      @lobby.incoming_pipe.send({
        command: command,
        player: self,
        parameter: parameter})
    end

    def write_pump(&block)
      while true
        yield @outgoing_pipe.receive
      end
    end
  end
end
