# This file should contain all the record creation needed to seed the database with its default values.
# The data can then be loaded with the rails db:seed command (or created alongside the database with db:setup).
#
# Examples:
#
#   movies = Movie.create([{ name: 'Star Wars' }, { name: 'Lord of the Rings' }])
#   Character.create(name: 'Luke', movie: movies.first)

Score.delete_all

Score.create(:name => 'john',:score => 5,:level => 1)
Score.create(:name => 'john',:score => 5,:level => 2)
Score.create(:name => 'john',:score => 5,:level => 3)
