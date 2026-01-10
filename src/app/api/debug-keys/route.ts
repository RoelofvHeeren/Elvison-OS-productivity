import { NextResponse } from 'next/server';

export async function GET() {
    const pubKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || 'NOT_SET';
    const privKey = process.env.VAPID_PRIVATE_KEY || 'NOT_SET';

    return NextResponse.json({
        serverPublicKeyStart: pubKey.substring(0, 5),
        serverPublicKeyEnd: pubKey.substring(pubKey.length - 5),
        hasPrivateKey: privKey !== 'NOT_SET',
        privateKeyLength: privKey.length
    });
}
