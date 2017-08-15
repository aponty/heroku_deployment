class LevelsController < ApplicationController
    include HTTParty

    def index
    end

    def racer

    end

    def fps
    end

    def god_earthquake
    end

    def score
        @scores = Score.where(level: params[:level])
		url = "https://arduinorelaytunnel.localtunnel.me/"
		response = HTTParty.get(url)
        puts response
    end

    def post
        data = params[:levels]
        @score = Score.new(:name => data[:name], :score => data[:score], :level => data[:level])
        if @score.save
            redirect_to action: "score", level: data[:level]
        else
            puts 'error'
        end
    end

end
