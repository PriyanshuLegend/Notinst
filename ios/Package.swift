// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "Notinst",
    platforms: [
        .iOS(.v16)
    ],
    products: [
        .library(
            name: "Notinst",
            targets: ["Notinst"]
        ),
    ],
    dependencies: [],
    targets: [
        .target(
            name: "Notinst",
            dependencies: [],
            path: "Sources/Notinst"
        ),
        .testTarget(
            name: "NotinstTests",
            dependencies: ["Notinst"],
            path: "Tests/NotinstTests"
        ),
    ]
)
