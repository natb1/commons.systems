import { describeReachabilitySmoke } from "@commons-systems/config/reachability-smoke";
describeReachabilitySmoke("landing", { staticAssetPath: "/robots.txt", feedXml: true });
