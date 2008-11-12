class String
  def from_timecode_to_seconds
    array = self.split(':').reverse()
    seconds = array[0].to_i;
    seconds += array[1].to_i * 60
    seconds += array[2].to_i * 60
  end
end

class Fixnum
  def to_timecode
    seconds = self.to_f
    hours = (seconds / 3600).floor
    seconds = seconds - (3600 * hours)
    minutes = (seconds / 60).floor
    seconds = seconds - (60 * minutes)  
    "#{hours.to_s.rjust(2,'00')}:#{minutes.to_s.rjust(2,'00')}:#{seconds.round.to_s.rjust(2,'00')}"
  end
end

tc = %w(
00:02:22
00:03:28
00:03:58
00:05:39
00:06:12
00:06:46
00:07:13
00:07:29
00:09:16
00:10:13
00:11:13
00:15:41
00:17:41
00:18:48
00:19:49
00:21:04
00:21:52
00:25:19
00:25:54
00:27:30
00:29:42
00:35:27
00:38:47
)

tc.each do |t|
  n = (t.from_timecode_to_seconds - ("00:01:10".from_timecode_to_seconds)).to_timecode
  puts n
end