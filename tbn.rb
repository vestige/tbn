require 'date'

def make_members(count)
  labels = ("A".."Z").to_a + ("a".."z").to_a

  if count > labels.length
    raise ArgumentError, "人数は最大 #{labels.length} 人までです。"
  end

  labels.first(count).map { |label| "#{label}さん" }
end

def generate_schedule(start_date, member_count, weeks)
  members = make_members(member_count)

  schedule = []
  last_person = nil
  round_members = []

  weeks.times do |i|
    if i % member_count == 0
      loop do
        round_members = members.shuffle
        break if last_person.nil? || round_members.first != last_person
      end
    end

    person = round_members[i % member_count]
    date = start_date + (i * 7)

    schedule << [date, person]
    last_person = person
  end

  schedule
end

puts "掃除当番表を作成します"

print "開始日付を入力してください (例: 2026-04-03): "
start_date_input = gets.chomp

print "人数を入力してください (最大52): "
member_count_input = gets.chomp

print "何週間分作りますか？: "
weeks_input = gets.chomp

begin
  start_date = Date.parse(start_date_input)
  member_count = Integer(member_count_input)
  weeks = Integer(weeks_input)

  if member_count <= 0 || weeks <= 0
    puts "人数と週間数は 1 以上を入力してください。"
    exit
  end

  schedule = generate_schedule(start_date, member_count, weeks)

  puts
  puts "=== 掃除当番表 ==="
  schedule.each do |date, person|
    puts "#{date.strftime('%Y/%m/%d')} : #{person}"
  end

rescue ArgumentError => e
  puts "エラー: #{e.message}"
  puts "開始日付は 2026-04-03 のように入力してください。" if e.message.include?("invalid date")
end