require "date"
require "json"

def make_members(count)
  labels = ("A".."Z").to_a + ("a".."z").to_a
  raise ArgumentError, "人数は最大 #{labels.length} 人までです。" if count > labels.length

  labels.first(count)
end

def generate_schedule(start_date_str, member_count, weeks)
  raise ArgumentError, "開始日を入力してください。" if start_date_str.nil? || start_date_str.empty?
  raise ArgumentError, "人数は1以上を入力してください。" if member_count <= 0
  raise ArgumentError, "週間数は1以上を入力してください。" if weeks <= 0

  start_date = Date.parse(start_date_str)
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

    schedule << {
      date: date.strftime("%Y/%m/%d"),
      person: person
    }

    last_person = person
  end

  JSON.generate(schedule)
end
