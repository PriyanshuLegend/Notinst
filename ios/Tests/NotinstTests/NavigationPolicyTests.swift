import XCTest
@testable import Notinst

final class NavigationPolicyTests: XCTestCase {
    // ─── Allowed URLs ─────────────────────────────────────────────────────────

    func testAllowsHomepage() {
        let url = URL(string: "https://www.instagram.com/")!
        XCTAssertEqual(NavigationPolicy.evaluate(url: url), .allow)
    }

    func testAllowsNormalPhotoPost() {
        let url = URL(string: "https://www.instagram.com/p/C9xyz012345/")!
        XCTAssertEqual(NavigationPolicy.evaluate(url: url), .allow)
    }

    func testAllowsNormalVideoPost() {
        // Video posts under /p/ must NOT be blocked
        let url = URL(string: "https://www.instagram.com/p/D1video98765/?img_index=1")!
        XCTAssertEqual(NavigationPolicy.evaluate(url: url), .allow)
    }

    func testAllowsProfilePage() {
        let url = URL(string: "https://www.instagram.com/priyanshu/")!
        XCTAssertEqual(NavigationPolicy.evaluate(url: url), .allow)
    }

    func testAllowsStories() {
        let url = URL(string: "https://www.instagram.com/stories/leila.m/3214567890/")!
        XCTAssertEqual(NavigationPolicy.evaluate(url: url), .allow)
    }

    func testAllowsDirectMessages() {
        let url = URL(string: "https://www.instagram.com/direct/inbox/")!
        XCTAssertEqual(NavigationPolicy.evaluate(url: url), .allow)

        let threadUrl = URL(string: "https://www.instagram.com/direct/t/17841400000000000/")!
        XCTAssertEqual(NavigationPolicy.evaluate(url: threadUrl), .allow)
    }

    func testAllowsAccountSettingsAndLogin() {
        let loginUrl = URL(string: "https://www.instagram.com/accounts/login/")!
        XCTAssertEqual(NavigationPolicy.evaluate(url: loginUrl), .allow)

        let editUrl = URL(string: "https://www.instagram.com/accounts/edit/")!
        XCTAssertEqual(NavigationPolicy.evaluate(url: editUrl), .allow)
    }

    func testAllowsExternalOAuthDomains() {
        let fbUrl = URL(string: "https://m.facebook.com/v20.0/dialog/oauth")!
        XCTAssertEqual(NavigationPolicy.evaluate(url: fbUrl), .allow)
    }

    // ─── Blocked URLs ─────────────────────────────────────────────────────────

    func testBlocksReelsFeed() {
        let url = URL(string: "https://www.instagram.com/reels/")!
        let decision = NavigationPolicy.evaluate(url: url)
        guard case .block(let reason, let redirect) = decision else {
            XCTFail("Expected .block but got \(decision)")
            return
        }
        XCTAssertTrue(reason.contains("Reels feed"))
        XCTAssertEqual(redirect, NavigationPolicy.homeURL)
    }

    func testBlocksReelsFeedNoSlash() {
        let url = URL(string: "https://www.instagram.com/reels")!
        let decision = NavigationPolicy.evaluate(url: url)
        guard case .block = decision else {
            XCTFail("Expected .block but got \(decision)")
            return
        }
    }

    func testBlocksIndividualReelViewer() {
        let url = URL(string: "https://www.instagram.com/reel/C7abcdef123/")!
        let decision = NavigationPolicy.evaluate(url: url)
        guard case .block(let reason, let redirect) = decision else {
            XCTFail("Expected .block but got \(decision)")
            return
        }
        XCTAssertTrue(reason.contains("Individual Reel viewer"))
        XCTAssertEqual(redirect, NavigationPolicy.homeURL)
    }

    func testBlocksReelsSubpaths() {
        let url = URL(string: "https://www.instagram.com/reels/audio/123456789/")!
        let decision = NavigationPolicy.evaluate(url: url)
        guard case .block = decision else {
            XCTFail("Expected .block but got \(decision)")
            return
        }
    }

    // ─── Explore vs Search Tests ──────────────────────────────────────────────

    func testBlocksExploreGrid() {
        let url = URL(string: "https://www.instagram.com/explore/")!
        let decision = NavigationPolicy.evaluate(url: url)
        guard case .block(let reason, let redirect) = decision else {
            XCTFail("Expected .block but got \(decision)")
            return
        }
        XCTAssertTrue(reason.contains("Explore recommendation grid"))
        XCTAssertEqual(redirect, NavigationPolicy.homeURL)
    }

    func testBlocksExploreGridNoSlash() {
        let url = URL(string: "https://www.instagram.com/explore")!
        let decision = NavigationPolicy.evaluate(url: url)
        guard case .block = decision else {
            XCTFail("Expected .block for /explore but got \(decision)")
            return
        }
    }

    func testAllowsSearchSubroute() {
        let url = URL(string: "https://www.instagram.com/explore/search/")!
        XCTAssertEqual(NavigationPolicy.evaluate(url: url), .allow)
    }

    func testAllowsSearchWithQueryParam() {
        let url = URL(string: "https://www.instagram.com/explore/?query=photographer")!
        XCTAssertEqual(NavigationPolicy.evaluate(url: url), .allow)

        let searchQUrl = URL(string: "https://www.instagram.com/explore/?q=design")!
        XCTAssertEqual(NavigationPolicy.evaluate(url: searchQUrl), .allow)
    }

    func testAllowsHashtagSearch() {
        let url = URL(string: "https://www.instagram.com/explore/tags/nature/")!
        XCTAssertEqual(NavigationPolicy.evaluate(url: url), .allow)
    }
}
