#if canImport(SwiftUI) && canImport(WebKit)
import SwiftUI
import WebKit

struct ContentView: View {
    @State private var isLoading = true
    @State private var canGoBack = false
    @State private var canGoForward = false
    @State private var webViewCoordinator: InstagramWebView.Coordinator?

    private let instagramURL = URL(string: "https://www.instagram.com/")!

    var body: some View {
        ZStack(alignment: .top) {
            Color.black
                .ignoresSafeArea()

            // Full-screen WKWebView loading Instagram directly
            InstagramWebView(
                url: instagramURL,
                isLoading: $isLoading,
                canGoBack: $canGoBack,
                canGoForward: $canGoForward
            )
            .ignoresSafeArea(edges: .bottom)

            // Minimalist loading indicator at top
            if isLoading {
                VStack {
                    ProgressView()
                        .progressViewStyle(CircularProgressViewStyle(tint: .white))
                        .scaleEffect(0.85)
                        .padding(8)
                        .background(Color.black.opacity(0.65))
                        .clipShape(Circle())
                        .padding(.top, 12)

                    Spacer()
                }
                .transition(.opacity)
                .animation(.easeInOut(duration: 0.25), value: isLoading)
            }
        }
        .preferredColorScheme(.dark)
    }
}
#endif
