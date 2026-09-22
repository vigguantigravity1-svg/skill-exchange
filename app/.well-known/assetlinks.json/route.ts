import { NextResponse } from 'next/server';

export async function GET() {
  const assetLinks = [
    {
      "relation": ["delegate_permission/common.handle_all_urls"],
      "target": {
        "namespace": "android_app",
        "package_name": "com.skillsechange.twa",
        "sha256_cert_fingerprints": [
          "38:65:36:A7:69:4F:FA:F4:46:91:50:A8:03:30:61:CD:7A:82:BB:5B:3E:90:1D:AC:4A:A2:8B:4B:46:80:18:9B"
        ]
      }
    }
  ];

  return NextResponse.json(assetLinks);
}
