import WidgetKit
import SwiftUI

// MARK: - Timeline Entry

struct CalendarEntry: TimelineEntry {
    let date: Date
    let data: CalendarWidgetData
}

// MARK: - Timeline Provider

struct CalendarProvider: TimelineProvider {
    func placeholder(in context: Context) -> CalendarEntry {
        CalendarEntry(date: Date(), data: CalendarWidgetData(from: nil))
    }
    
    func getSnapshot(in context: Context, completion: @escaping (CalendarEntry) -> Void) {
        let data = WidgetDataBridge.shared.getWidgetData(widgetType: "calendar")
        let entry = CalendarEntry(date: Date(), data: CalendarWidgetData(from: data))
        completion(entry)
    }
    
    func getTimeline(in context: Context, completion: @escaping (Timeline<CalendarEntry>) -> Void) {
        let data = WidgetDataBridge.shared.getWidgetData(widgetType: "calendar")
        let entry = CalendarEntry(date: Date(), data: CalendarWidgetData(from: data))
        
        // Update every 30 minutes for calendar
        let nextUpdate = Calendar.current.date(byAdding: .minute, value: 30, to: Date())!
        let timeline = Timeline(entries: [entry], policy: .after(nextUpdate))
        completion(timeline)
    }
}

// MARK: - Widget Views

struct CalendarWidgetView: View {
    var entry: CalendarProvider.Entry
    @Environment(\.widgetFamily) var family
    
    var body: some View {
        switch family {
        case .systemSmall:
            SmallCalendarView(data: entry.data)
        case .systemMedium:
            MediumCalendarView(data: entry.data)
        default:
            SmallCalendarView(data: entry.data)
        }
    }
}

struct SmallCalendarView: View {
    let data: CalendarWidgetData
    
    var body: some View {
        VStack(spacing: 8) {
            // Date or Nanakshahi
            if !data.nanakshahiDate.isEmpty {
                Text(data.nanakshahiDate)
                    .font(.caption)
                    .foregroundColor(data.isDark ? .white.opacity(0.7) : .black.opacity(0.7))
            } else {
                Text(formattedDate())
                    .font(.caption)
                    .foregroundColor(data.isDark ? .white.opacity(0.7) : .black.opacity(0.7))
            }
            
            // Countdown
            if data.daysUntil >= 0 {
                HStack(alignment: .lastTextBaseline, spacing: 2) {
                    if data.daysUntil == 0 {
                        Text("☬")
                            .font(.title)
                    } else {
                        Text("\(data.daysUntil)")
                            .font(.system(size: 40, weight: .bold))
                            .foregroundColor(.orange)
                    }
                    
                    Text(data.daysUntil == 1 ? "day" : (data.daysUntil == 0 ? "Today!" : "days"))
                        .font(.caption)
                        .foregroundColor(data.isDark ? .white.opacity(0.7) : .black.opacity(0.7))
                }
            } else {
                Text("-")
                    .font(.system(size: 40, weight: .bold))
                    .foregroundColor(data.isDark ? .white : .black)
            }
            
            // Event name
            Text(eventText())
                .font(.caption)
                .foregroundColor(data.isDark ? .white : .black)
                .multilineTextAlignment(.center)
                .lineLimit(2)
            
            // Hukamnama preview
            if !data.hukamnamaPreview.isEmpty {
                Divider()
                    .background(data.isDark ? Color.white.opacity(0.3) : Color.black.opacity(0.3))
                
                Text("☬ \(truncatedHukamnama())")
                    .font(.caption2)
                    .foregroundColor(data.isDark ? .white.opacity(0.6) : .black.opacity(0.6))
                    .lineLimit(1)
            }
        }
        .padding()
        .containerBackground(data.isDark ? Color.black.gradient : Color.white.gradient, for: .widget)
    }
    
    private func formattedDate() -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "EEEE, MMM d"
        return formatter.string(from: Date())
    }
    
    private func eventText() -> String {
        if data.daysUntil == 0 {
            return data.nextEventName
        } else if data.daysUntil > 0 {
            return "until \(data.nextEventName)"
        } else {
            return data.nextEventName
        }
    }
    
    private func truncatedHukamnama() -> String {
        if data.hukamnamaPreview.count > 30 {
            return String(data.hukamnamaPreview.prefix(27)) + "..."
        }
        return data.hukamnamaPreview
    }
}

struct MediumCalendarView: View {
    let data: CalendarWidgetData
    
    var body: some View {
        HStack(spacing: 20) {
            // Left: Date and countdown
            VStack(alignment: .leading, spacing: 8) {
                if !data.nanakshahiDate.isEmpty {
                    Text(data.nanakshahiDate)
                        .font(.subheadline)
                        .foregroundColor(data.isDark ? .white.opacity(0.7) : .black.opacity(0.7))
                } else {
                    Text(formattedDate())
                        .font(.subheadline)
                        .foregroundColor(data.isDark ? .white.opacity(0.7) : .black.opacity(0.7))
                }
                
                HStack(alignment: .lastTextBaseline, spacing: 4) {
                    if data.daysUntil == 0 {
                        Text("☬")
                            .font(.largeTitle)
                    } else if data.daysUntil > 0 {
                        Text("\(data.daysUntil)")
                            .font(.system(size: 48, weight: .bold))
                            .foregroundColor(.orange)
                    } else {
                        Text("-")
                            .font(.system(size: 48, weight: .bold))
                            .foregroundColor(data.isDark ? .white : .black)
                    }
                    
                    Text(data.daysUntil == 1 ? "day" : (data.daysUntil == 0 ? "Today!" : "days"))
                        .font(.subheadline)
                        .foregroundColor(data.isDark ? .white.opacity(0.7) : .black.opacity(0.7))
                }
                
                Text(eventText())
                    .font(.headline)
                    .foregroundColor(data.isDark ? .white : .black)
                    .lineLimit(1)
            }
            
            Spacer()
            
            // Right: Hukamnama
            if !data.hukamnamaPreview.isEmpty {
                VStack(alignment: .trailing, spacing: 8) {
                    Text("☬ Today's Hukamnama")
                        .font(.caption.bold())
                        .foregroundColor(.orange)
                    
                    Text(truncatedHukamnama())
                        .font(.caption)
                        .foregroundColor(data.isDark ? .white.opacity(0.7) : .black.opacity(0.7))
                        .multilineTextAlignment(.trailing)
                        .lineLimit(3)
                        .frame(width: 140)
                }
            }
        }
        .padding()
        .containerBackground(data.isDark ? Color.black.gradient : Color.white.gradient, for: .widget)
    }
    
    private func formattedDate() -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "EEEE, MMM d"
        return formatter.string(from: Date())
    }
    
    private func eventText() -> String {
        if data.daysUntil == 0 {
            return data.nextEventName
        } else if data.daysUntil > 0 {
            return "until \(data.nextEventName)"
        } else {
            return data.nextEventName
        }
    }
    
    private func truncatedHukamnama() -> String {
        if data.hukamnamaPreview.count > 60 {
            return String(data.hukamnamaPreview.prefix(57)) + "..."
        }
        return data.hukamnamaPreview
    }
}

// MARK: - Widget Configuration

struct CalendarWidget: Widget {
    let kind: String = "calendar"
    
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: CalendarProvider()) { entry in
            CalendarWidgetView(entry: entry)
        }
        .configurationDisplayName("Gurpurab Calendar")
        .description("Upcoming Gurpurabs and daily Hukamnama")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}
