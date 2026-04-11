import WidgetKit
import SwiftUI

// MARK: - Timeline Entry

struct NitnemEntry: TimelineEntry {
    let date: Date
    let data: NitnemWidgetData
}

// MARK: - Timeline Provider

struct NitnemProvider: TimelineProvider {
    func placeholder(in context: Context) -> NitnemEntry {
        NitnemEntry(date: Date(), data: NitnemWidgetData(from: nil))
    }
    
    func getSnapshot(in context: Context, completion: @escaping (NitnemEntry) -> Void) {
        let data = WidgetDataBridge.shared.getWidgetData(widgetType: "nitnem")
        let entry = NitnemEntry(date: Date(), data: NitnemWidgetData(from: data))
        completion(entry)
    }
    
    func getTimeline(in context: Context, completion: @escaping (Timeline<NitnemEntry>) -> Void) {
        let data = WidgetDataBridge.shared.getWidgetData(widgetType: "nitnem")
        let entry = NitnemEntry(date: Date(), data: NitnemWidgetData(from: data))
        
        // Update every 15 minutes
        let nextUpdate = Calendar.current.date(byAdding: .minute, value: 15, to: Date())!
        let timeline = Timeline(entries: [entry], policy: .after(nextUpdate))
        completion(timeline)
    }
}

// MARK: - Widget Views

struct NitnemWidgetView: View {
    var entry: NitnemProvider.Entry
    @Environment(\.widgetFamily) var family
    
    var body: some View {
        switch family {
        case .systemSmall:
            SmallNitnemView(data: entry.data)
        case .systemMedium:
            MediumNitnemView(data: entry.data)
        case .systemLarge:
            LargeNitnemView(data: entry.data)
        default:
            SmallNitnemView(data: entry.data)
        }
    }
}

struct SmallNitnemView: View {
    let data: NitnemWidgetData
    
    var body: some View {
        VStack(spacing: 8) {
            // Streak
            Text(data.streak > 0 ? "🔥 \(data.streak)" : "🙏 \(data.streak)")
                .font(.title2.bold())
                .foregroundColor(data.isDark ? .white : .black)
            
            // Progress percentage
            Text("\(data.progress)%")
                .font(.system(size: 36, weight: .bold))
                .foregroundColor(data.isDark ? .white : .black)
            
            // Progress bar
            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    RoundedRectangle(cornerRadius: 4)
                        .fill(Color.white.opacity(0.2))
                        .frame(height: 8)
                    
                    RoundedRectangle(cornerRadius: 4)
                        .fill(LinearGradient(
                            gradient: Gradient(colors: [Color.orange, Color.orange.opacity(0.8)]),
                            startPoint: .leading,
                            endPoint: .trailing
                        ))
                        .frame(width: geo.size.width * CGFloat(data.progress) / 100, height: 8)
                }
            }
            .frame(height: 8)
            
            // Status
            Text("\(data.completedBanis) of \(data.totalBanis) banis")
                .font(.caption)
                .foregroundColor(data.isDark ? .white.opacity(0.7) : .black.opacity(0.7))
        }
        .padding()
        .containerBackground(data.isDark ? Color.black.gradient : Color.white.gradient, for: .widget)
    }
}

struct MediumNitnemView: View {
    let data: NitnemWidgetData
    
    var body: some View {
        HStack(spacing: 20) {
            // Left: Streak and progress
            VStack(alignment: .leading, spacing: 8) {
                Text(data.streak > 0 ? "🔥 \(data.streak)" : "🙏 \(data.streak)")
                    .font(.title2.bold())
                    .foregroundColor(data.isDark ? .white : .black)
                
                Text("\(data.progress)%")
                    .font(.system(size: 40, weight: .bold))
                    .foregroundColor(data.isDark ? .white : .black)
                
                Text("day streak")
                    .font(.caption)
                    .foregroundColor(data.isDark ? .white.opacity(0.7) : .black.opacity(0.7))
            }
            
            Spacer()
            
            // Right: Progress bar and banis
            VStack(alignment: .trailing, spacing: 12) {
                // Progress bar
                GeometryReader { geo in
                    ZStack(alignment: .leading) {
                        RoundedRectangle(cornerRadius: 4)
                            .fill(Color.white.opacity(0.2))
                            .frame(height: 12)
                        
                        RoundedRectangle(cornerRadius: 4)
                            .fill(LinearGradient(
                                gradient: Gradient(colors: [Color.orange, Color.orange.opacity(0.8)]),
                                startPoint: .leading,
                                endPoint: .trailing
                            ))
                            .frame(width: geo.size.width * CGFloat(data.progress) / 100, height: 12)
                    }
                }
                .frame(width: 120, height: 12)
                
                Text("\(data.completedBanis) of \(data.totalBanis) banis completed")
                    .font(.caption)
                    .foregroundColor(data.isDark ? .white.opacity(0.7) : .black.opacity(0.7))
                    .multilineTextAlignment(.trailing)
            }
        }
        .padding()
        .containerBackground(data.isDark ? Color.black.gradient : Color.white.gradient, for: .widget)
    }
}

struct LargeNitnemView: View {
    let data: NitnemWidgetData
    
    var body: some View {
        VStack(spacing: 16) {
            // Header
            HStack {
                Text(data.streak > 0 ? "🔥 \(data.streak)" : "🙏 \(data.streak)")
                    .font(.title.bold())
                    .foregroundColor(data.isDark ? .white : .black)
                
                Spacer()
                
                Text("\(data.progress)%")
                    .font(.system(size: 48, weight: .bold))
                    .foregroundColor(data.isDark ? .white : .black)
            }
            
            // Progress bar
            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    RoundedRectangle(cornerRadius: 6)
                        .fill(Color.white.opacity(0.2))
                        .frame(height: 16)
                    
                    RoundedRectangle(cornerRadius: 6)
                        .fill(LinearGradient(
                            gradient: Gradient(colors: [Color.orange, Color.orange.opacity(0.8)]),
                            startPoint: .leading,
                            endPoint: .trailing
                        ))
                        .frame(width: geo.size.width * CGFloat(data.progress) / 100, height: 16)
                }
            }
            .frame(height: 16)
            
            // Status
            Text("\(data.completedBanis) of \(data.totalBanis) banis completed today")
                .font(.subheadline)
                .foregroundColor(data.isDark ? .white.opacity(0.7) : .black.opacity(0.7))
            
            Spacer()
        }
        .padding()
        .containerBackground(data.isDark ? Color.black.gradient : Color.white.gradient, for: .widget)
    }
}

// MARK: - Widget Configuration

struct NitnemWidget: Widget {
    let kind: String = "nitnem"
    
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: NitnemProvider()) { entry in
            NitnemWidgetView(entry: entry)
        }
        .configurationDisplayName("Nitnem Tracker")
        .description("Track your daily Nitnem progress and streak")
        .supportedFamilies([.systemSmall, .systemMedium, .systemLarge])
    }
}
