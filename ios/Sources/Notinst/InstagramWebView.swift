#if canImport(SwiftUI) && canImport(WebKit)
import SwiftUI
import WebKit

/// A SwiftUI wrapper around WKWebView configured for a persistent,
/// distraction-free Instagram session equipped with the Notinst Reels Firewall.
struct InstagramWebView: UIViewRepresentable {
    let url: URL
    @Binding var isLoading: Bool
    @Binding var canGoBack: Bool
    @Binding var canGoForward: Bool

    func makeCoordinator() -> Coordinator {
        Coordinator(self)
    }

    func makeUIView(context: Context) -> WKWebView {
        let configuration = WKWebViewConfiguration()

        // 1. Persistent website data store retains login cookies across launches
        configuration.websiteDataStore = WKWebsiteDataStore.default()

        // 2. Enable inline media playback for photos, videos, and stories
        configuration.allowsInlineMediaPlayback = true
        configuration.mediaTypesRequiringUserActionForPlayback = []

        // 3. Inject Notinst Reels Firewall scripts and message handler
        let userContentController = WKUserContentController()
        userContentController.addUserScript(WebFilters.makeUserScript())
        userContentController.add(context.coordinator, name: WebFilters.messageHandlerName)
        configuration.userContentController = userContentController

        let webView = WKWebView(frame: .zero, configuration: configuration)
        webView.navigationDelegate = context.coordinator

        // Enable native iOS swipe gestures to go back/forward
        webView.allowsBackForwardNavigationGestures = true

        // Ensure seamless dark background
        webView.isOpaque = false
        webView.backgroundColor = .black
        webView.scrollView.backgroundColor = .black
        webView.scrollView.indicatorStyle = .white

        context.coordinator.webView = webView

        // Load Instagram
        let request = URLRequest(url: url)
        webView.load(request)

        return webView
    }

    func updateUIView(_ uiView: WKWebView, context: Context) {
        // No-op for standard navigation
    }

    class Coordinator: NSObject, WKNavigationDelegate, WKScriptMessageHandler {
        var parent: InstagramWebView
        weak var webView: WKWebView?

        init(_ parent: InstagramWebView) {
            self.parent = parent
        }

        // ─── Navigation Firewall Enforcement ──────────────────────────────

        func webView(
            _ webView: WKWebView,
            decidePolicyFor navigationAction: WKNavigationAction,
            decisionHandler: @escaping (WKNavigationActionPolicy) -> Void
        ) {
            let targetURL = navigationAction.request.url
            let decision = NavigationPolicy.evaluate(url: targetURL)

            switch decision {
            case .allow:
                decisionHandler(.allow)

            case .block(let reason, let redirectURL):
                decisionHandler(.cancel)

                // Return user to safe surface (Home) without displaying a browser error
                if let redirect = redirectURL {
                    DispatchQueue.main.async {
                        webView.load(URLRequest(url: redirect))
                    }
                }
            }
        }

        // ─── Client-side Script Notifications ─────────────────────────────

        func userContentController(
            _ userContentController: WKUserContentController,
            didReceive message: WKScriptMessage
        ) {
            guard message.name == WebFilters.messageHandlerName else { return }

            #if DEBUG
            if let dict = message.body as? [String: Any],
               let event = dict["event"] as? String {
                switch event {
                case "filtered_suggested_post":
                    let reason = dict["reason"] as? String ?? "Suggested content indicator"
                    print("""
                    [Notinst] FILTERED SUGGESTED POST
                    Reason: \(reason)
                    """)
                case "blocked_explore_click", "blocked_push_state_explore":
                    let targetUrl = dict["url"] as? String ?? dict["href"] as? String ?? "Explore"
                    print("""
                    [Notinst] BLOCKED EXPLORE
                    URL: \(targetUrl)
                    """)
                case "blocked_reels_click", "blocked_push_state_reels":
                    let targetUrl = dict["url"] as? String ?? dict["href"] as? String ?? "Reels"
                    print("""
                    [Notinst] BLOCKED
                    URL: \(targetUrl)
                    Reason: In-page navigation to Reels
                    """)
                default:
                    print("""
                    [Notinst] Firewall Event: \(event)
                    Payload: \(dict)
                    """)
                }
            }
            #endif
        }

        // ─── Navigation Lifecycle Observers ───────────────────────────────

        func webView(_ webView: WKWebView, didStartProvisionalNavigation navigation: WKNavigation!) {
            DispatchQueue.main.async {
                self.parent.isLoading = true
                self.parent.canGoBack = webView.canGoBack
                self.parent.canGoForward = webView.canGoForward
            }
        }

        func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
            DispatchQueue.main.async {
                self.parent.isLoading = false
                self.parent.canGoBack = webView.canGoBack
                self.parent.canGoForward = webView.canGoForward
            }
        }

        func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
            DispatchQueue.main.async {
                self.parent.isLoading = false
                self.parent.canGoBack = webView.canGoBack
                self.parent.canGoForward = webView.canGoForward
            }
        }

        func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
            DispatchQueue.main.async {
                self.parent.isLoading = false
                self.parent.canGoBack = webView.canGoBack
                self.parent.canGoForward = webView.canGoForward
            }
        }
    }
}
#endif
