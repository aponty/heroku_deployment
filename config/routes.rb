Rails.application.routes.draw do
    # For details on the DSL available within this file, see http://guides.rubyonrails.org/routing.html
    root :to => redirect('/levels')
    get '/levels', to: 'levels#index'
    get '/levels/racer', to: 'levels#racer'
    get '/levels/fps', to: 'levels#fps'
    get '/levels/god_earthquake', to: 'levels#god_earthquake'
    get '/levels/score', to: 'levels#score'
    post '/levels', to: 'levels#post'
end
