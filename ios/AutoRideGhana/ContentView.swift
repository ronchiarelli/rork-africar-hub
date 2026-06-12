//
//  ContentView.swift
//  AutoRideGhana
//
//  Created by Rork on June 12, 2026.
//

import SwiftUI

/// Root view with an auth guard: shows the welcome/auth flow when signed out,
/// or the main tab experience when authenticated.
struct ContentView: View {
    @State private var app = AppState()

    var body: some View {
        Group {
            if app.isAuthenticated {
                MainTabView()
                    .transition(.opacity)
            } else {
                WelcomeView()
                    .transition(.opacity)
            }
        }
        .animation(.easeInOut(duration: 0.3), value: app.isAuthenticated)
        .environment(app)
    }
}

#Preview {
    ContentView()
}
