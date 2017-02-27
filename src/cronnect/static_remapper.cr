require "kemal"

module Cronnect
  class StaticRemapper < Kemal::Handler
    def initialize(static_path : String, mapping : Hash(String, String))
      @static_handler = Kemal::StaticFileHandler.new(static_path)
      @mapping = mapping
    end

    def call(ctx)
      if @mapping.has_key?(ctx.request.path)
        ctx.request.path = @mapping[ctx.request.path]
        @static_handler.call(ctx)
      else
        call_next(ctx)
      end
    end
  end
end
