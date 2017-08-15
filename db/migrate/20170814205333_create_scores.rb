class CreateScores < ActiveRecord::Migration[5.1]
  def change
    create_table :scores do |t|
        t.string :name
        t.integer :score
        t.integer :level
    end
  end
end
