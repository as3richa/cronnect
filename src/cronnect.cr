require "./cronnect/*"
require "kemal"
require "json"

add_handler(Cronnect::StaticRemapper.new("public", {
  "/" => "/index.html",
  "/scripts.js" => "/scripts.js"
}))

main_lobby = Cronnect::MainLobby.new
spawn do
  main_lobby.run
end

command_table = begin
  commands = [:nickname, :challenge, :cancel, :accept, :decline, :drop, :leave]
  Hash.zip(commands.map { |v| v.to_s.upcase }, commands)
end

ws "/engine" do |socket|
  player = Cronnect::Player.new(main_lobby)

  spawn do
    begin
      player.write_pump do |message|
        socket.send(message.to_json)
      end
    rescue IO::Error
    end
  end

  socket.on_message do |message|
    begin
      data = JSON.parse(message)
      command = command_table[data["command"].as_s]
    rescue JSON::ParseException | ArgumentError | KeyError
      next
    end

    parameter = nil

    begin
      case command
      when :nickname
        parameter = data["nickname"].as_s
      when :challenge
        parameter = data["target"].as_s
      when :drop
        parameter = data["column"].as_i
      end

      player.run_command(command, parameter)
    rescue ArgumentError | KeyError
      next
    end
  end

  socket.on_close do
    player.run_command(:quit, nil)
  end
end

Kemal.run
