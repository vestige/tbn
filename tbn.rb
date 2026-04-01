require 'date'

members = [
  "Aさん",
  "Bさん",
  "Cさん",
  "Dさん",
  "Eさん",
  "Fさん",
  "Gさん",
  "Hさん"
]

start_date = Date.new(2026, 4, 3)
end_date   = Date.new(2026, 7, 31)

current_date = start_date
index = 0
last_person = nil
round_members = []

while current_date <= end_date
  if index % members.length == 0
    loop do
      round_members = members.shuffle
      break if last_person.nil? || round_members.first != last_person
    end
  end

  person = round_members[index % members.length]
  puts "#{current_date.strftime('%Y/%m/%d')} : #{person}"

  last_person = person
  current_date += 7
  index += 1
end