# EchoOS Liquid filters (IMPLEMENTATION-PLAN §6.2).
module EchoOSFilters
  # Split a multi-paragraph string into an array of paragraphs: split on blank
  # lines, then collapse intra-paragraph line wraps to spaces and strip.
  # Liquid's `split` filter cannot match real newlines, so this lives in Ruby.
  def split_paragraphs(input)
    return [] unless input.is_a?(String)
    input.split(/\n[ \t]*\n/).map { |p| p.gsub(/\s*\n\s*/, ' ').strip }
  end
end
Liquid::Template.register_filter(EchoOSFilters)
