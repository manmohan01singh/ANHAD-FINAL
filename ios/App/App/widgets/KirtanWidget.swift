import WidgetKit
import SwiftUI

// MARK: - Timeline Entry

struct KirtanEntry: TimelineEntry {
    let date: Date
    let data: KirtanWidgetData
}

// MARK: - Timeline Provider

struct KirtanProvider: TimelineProvider {
    func placeholder(in context: Context) -> KirtanEntry {
        KirtanEntry(date: Date(), data: KirtanWidgetData(from: nil))
    }
    
    func getSnapshot(in context: Context, completion: @escaping (KirtanEntry) -> Void) {
        let data = WidgetDataBridge.shared.getWidgetData(widgetType: "kirtan")
        let entry = KirtanEntry(date: Date(), data: KirtanWidgetData(from: data))
        completion(entry)
    }
    
    func getTimeline(in context: Context, completion: @escaping (Timeline<KirtanEntry>) -> Void) {
        let data = WidgetDataBridge.shared.getWidgetData(widgetType: "kirtan")
        let entry = KirtanEntry(date: Date(), data: KirtanWidgetData(from: data))
        
        // Update every 5 minutes for live player
        let nextUpdate = Calendar.current.date(byAdding: .minute, value: 5, to: Date())!
        let timeline = Timeline(entries: [entry], policy: .after(nextUpdate))
        completion(timeline)
    }
}

// MARK: - Widget Views

struct KirtanWidgetView: View {
    var entry: KirtanProvider.Entry
    @Environment(\.widgetFamily) var family
    
    var body: some View {
        switch family {
        case .systemSmall:
            SmallKirtanView(data: entry.data)
        case .systemMedium:
            MediumKirtanView(data: entry.data)
        default:
            SmallKirtanView(data: entry.data)
        }
    }
}

struct SmallKirtanView: View {
    let data: KirtanWidgetData
    
    var body: some View {
        VStack(spacing: 10) {
            // Icon
            ZStack {
                Circle()
                    .fill(Color.orange.opacity(0.2))
                    .frame(width: 44, height: 44)
                
                Text("🎵")
                    .font(.title2)
            }
            
            // Track name
            Text(truncatedTrack())
                .font(.subheadline.bold())
                .foregroundColor(data.isDark ? .white : .black)
                .multilineTextAlignment(.center)
                .lineLimit(1)
            
            // Station
            Text(truncatedStation())
                .font(.caption)
                .foregroundColor(data.isDark ? .white.opacity(0.7) : .black.opacity(0.7))
                .lineLimit(1)
            
            // Status
            HStack(spacing: 4) {
                Text(data.isPlaying ? "▶" : "⏸")
                    .foregroundColor(data.isPlaying ? .green : .orange)
                Text(data.isPlaying ? "Playing" : "Paused")
                    .font(.caption)
                    .foregroundColor(data.isPlaying ? .green : .orange)
            }
        }
        .padding()
        .containerBackground(data.isDark ? Color.black.gradient : Color.white.gradient, for: .widget)
    }
    
    private func truncatedTrack() -> String {
        if data.trackName.count > 20 {
            return String(data.trackName.prefix(17)) + "..."
        }
        return data.trackName
    }
    
    private func truncatedStation() -> String {
        var text = data.stationName
        if !data.duration.isEmpty {
            text += " • \(data.duration)"
        }
        if text.count > 25 {
            return String(text.prefix(22)) + "..."
        }
        return text
    }
}

struct MediumKirtanView: View {
    let data: KirtanWidgetData
    
    var body: some View {
        HStack(spacing: 16) {
            // Left: Icon
            ZStack {
                Circle()
                    .fill(Color.orange.opacity(0.2))
                    .frame(width: 56, height: 56)
                
                Text("🎵")
                    .font(.largeTitle)
            }
            
            // Middle: Track info
            VStack(alignment: .leading, spacing: 6) {
                Text(data.trackName)
                    .font(.headline.bold())
                    .foregroundColor(data.isDark ? .white : .black)
                    .lineLimit(1)
                
                HStack(spacing: 4) {
                    Text(data.stationName)
                        .font(.subheadline)
                        .foregroundColor(data.isDark ? .white.opacity(0.7) : .black.opacity(0.7))
                    
                    if !data.duration.isEmpty {
                        Text("•")
                            .foregroundColor(data.isDark ? .white.opacity(0.5) : .black.opacity(0.5))
                        Text(data.duration)
                            .font(.subheadline)
                            .foregroundColor(data.isDark ? .white.opacity(0.7) : .black.opacity(0.7))
                    }
                }
                .lineLimit(1)
                
                // Status badge
                HStack(spacing: 4) {
                    Circle()
                        .fill(data.isPlaying ? Color.green : Color.orange)
                        .frame(width: 8, height: 8)
                    Text(data.isPlaying ? "Playing" : "Paused")
                        .font(.caption)
                        .foregroundColor(data.isPlaying ? .green : .orange)
                }
                .padding(.horizontal, 8)
                .padding(.vertical, 4)
                .background((data.isPlaying ? Color.green : Color.orange).opacity(0.15))
                .cornerRadius(12)
            }
            
            Spacer()
        }
        .padding()
        .containerBackground(data.isDark ? Color.black.gradient : Color.white.gradient, for: .widget)
    }
}

// MARK: - Widget Configuration

struct KirtanWidget: Widget {
    let kind: String = "kirtan"
    
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: KirtanProvider()) { entry in
            KirtanWidgetView(entry: entry)
        }
        .configurationDisplayName("Live Kirtan")
        .description("Current track and quick access to player")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}
