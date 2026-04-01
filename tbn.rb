require 'date'

def make_members(count)
  labels = ("A".."Z").to_a + ("a".."z").to_a
  raise ArgumentError, "人数は最大 #{labels.length} 人までです。" if count > labels.length
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

  raise ArgumentError, "人数と週間数は 1 以上を入力してください。" if member_count <= 0 || weeks <= 0

  schedule = generate_schedule(start_date, member_count, weeks)

  puts
  puts "=== 掃除当番表 ==="
  schedule.each do |date, person|
    puts "#{date.strftime('%Y/%m/%d')} : #{person}"
  end

  puts
  puts "Enterキーで終了します"
  STDIN.gets
rescue => e
  warn "エラー: #{e.message}"
  puts "Enterキーで終了します"
  STDIN.gets
end