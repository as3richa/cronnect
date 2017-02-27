module Cronnect
  class Lobby
    alias RequestParameter = String | Int32 | Nil
    alias Request = NamedTuple(command: Symbol, player: Player, parameter: RequestParameter)

    alias HelloResponse = NamedTuple(command: String, success: Bool, message: String)
    alias NicknameResponse = NamedTuple(command: String, success: Bool, nickname: String, message: String)
    alias ChallengeResponse = NamedTuple(command: String, success: Bool, target: String, message: String)
    alias ChallengedResponse = NamedTuple(command: String, success: Bool, challenger: String, message: String)
    alias AcceptResponse = NamedTuple(command: String, success: Bool, message: String)
    alias CancelResponse = NamedTuple(command: String, success: Bool, message: String)
    alias DropResponse = NamedTuple(command: String, success: Bool, column: Int32, player: Int32, message: String)
    alias LeaveResponse = NamedTuple(command: String, success: Bool, message: String)
    alias WinResponse = NamedTuple(command: String, success: Bool, winner: Int32, grid: Array(Array(Bool)) message: String)
    alias ErrorResponse = NamedTuple(command: String, success: Bool, message: String)

    alias Response = HelloResponse | NicknameResponse | ChallengeResponse | ChallengedResponse |
      AcceptResponse | CancelResponse | DropResponse | LeaveResponse | WinResponse | ErrorResponse

    alias DispatchTable = Hash(Symbol, Proc(Player, RequestParameter, Nil))

    getter :incoming_pipe

    @incoming_pipe : Channel(Request)
    @dispatch_table : DispatchTable

    def initialize
      @incoming_pipe = Channel(Request).new(BUFFERING)
      @dispatch_table = DispatchTable.new
    end

    def accepts?(command : Symbol)
      @dispatch_table.has_key?(command)
    end

    def run
      while true
        request = @incoming_pipe.receive
        @dispatch_table[request[:command]].call(request[:player], request[:parameter])
      end
    rescue Channel::ClosedError
    end

    def terminate
      @incoming_pipe.close
    end
  end
end
