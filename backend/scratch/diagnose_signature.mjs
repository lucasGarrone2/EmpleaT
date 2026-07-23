import crypto from 'crypto';

// ============================================================
// DIAGNOSTIC SCRIPT: Mercado Pago Webhook Signature Verification
// ============================================================
// Using REAL data from the failed webhook notification log

const SECRET_STR = '4978756c3da8453e8ef6d6e1e2f620d4e6d93c0e97a5aa6f40bceb5f95337c38';
const TARGET_V1 = 'c3ca32d7426987bd486dc293c76de6defc5c6b565fea38367d8cea860ee31334';

// Values extracted from the real logs
const DATA_ID = '165503479276';
const X_REQUEST_ID = 'e0c7dadf-02d8-44ab-9218-3459e5a2cda2';
const TS = '1782248410';
const ROOT_ID = '133845303844'; // The "id" field from the body (root notification ID)

function testManifest(label, manifest, secret) {
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(manifest);
    const sig = hmac.digest('hex');
    const match = sig === TARGET_V1;
    console.log(`${match ? '✅ MATCH!' : '❌ NO'} | ${label}`);
    if (match) {
        console.log(`   >>> FOUND THE SOLUTION! manifest: "${manifest}" with secret type: ${typeof secret}`);
    }
    return match;
}

console.log(`\nTarget signature (v1): ${TARGET_V1}\n`);
console.log('='.repeat(80));
console.log('TESTING SECRET AS UTF-8 STRING');
console.log('='.repeat(80));

// Test 1: Standard manifest (current implementation)
testManifest('Standard manifest (current code)', 
    `id:${DATA_ID};request-id:${X_REQUEST_ID};ts:${TS};`, SECRET_STR);

// Test 2: Without trailing semicolon
testManifest('No trailing semicolon', 
    `id:${DATA_ID};request-id:${X_REQUEST_ID};ts:${TS}`, SECRET_STR);

// Test 3: Using root ID instead of data.id
testManifest('Root ID instead of data.id', 
    `id:${ROOT_ID};request-id:${X_REQUEST_ID};ts:${TS};`, SECRET_STR);

// Test 4: Empty data.id
testManifest('Empty data.id', 
    `id:;request-id:${X_REQUEST_ID};ts:${TS};`, SECRET_STR);

// Test 5: No id field at all
testManifest('No id field (omitted)', 
    `request-id:${X_REQUEST_ID};ts:${TS};`, SECRET_STR);

// Test 6: Only ts and request-id (reversed order)
testManifest('ts first, then request-id', 
    `ts:${TS};request-id:${X_REQUEST_ID};`, SECRET_STR);

// Test 7: data.id from body (as string)
testManifest('Data.id from body as string', 
    `id:${String(DATA_ID)};request-id:${X_REQUEST_ID};ts:${TS};`, SECRET_STR);

// Test 8: With spaces after colons
testManifest('With spaces after colons', 
    `id: ${DATA_ID};request-id: ${X_REQUEST_ID};ts: ${TS};`, SECRET_STR);

// Test 9: Without id section when data.id is in query
testManifest('Omit id: section entirely', 
    `request-id:${X_REQUEST_ID};ts:${TS};`, SECRET_STR);

// Test 10: Only ts
testManifest('Only ts', 
    `ts:${TS};`, SECRET_STR);

// Test 11: Manifest with newline at end
testManifest('With newline', 
    `id:${DATA_ID};request-id:${X_REQUEST_ID};ts:${TS};\n`, SECRET_STR);

console.log('\n' + '='.repeat(80));
console.log('TESTING SECRET AS HEX-DECODED BUFFER');
console.log('='.repeat(80));

const SECRET_BUF = Buffer.from(SECRET_STR, 'hex');

testManifest('Standard manifest (hex secret)', 
    `id:${DATA_ID};request-id:${X_REQUEST_ID};ts:${TS};`, SECRET_BUF);

testManifest('No trailing semicolon (hex secret)', 
    `id:${DATA_ID};request-id:${X_REQUEST_ID};ts:${TS}`, SECRET_BUF);

testManifest('Root ID (hex secret)', 
    `id:${ROOT_ID};request-id:${X_REQUEST_ID};ts:${TS};`, SECRET_BUF);

testManifest('Empty data.id (hex secret)', 
    `id:;request-id:${X_REQUEST_ID};ts:${TS};`, SECRET_BUF);

testManifest('No id field (hex secret)', 
    `request-id:${X_REQUEST_ID};ts:${TS};`, SECRET_BUF);

console.log('\n' + '='.repeat(80));
console.log('TESTING CONDITIONAL MANIFEST (OMIT MISSING PARTS)');
console.log('='.repeat(80));

// The official docs say: "If any value is missing, that specific pair should be omitted"
// What if MP omits parts based on some condition?

// Construct manifest conditionally
function buildConditionalManifest(dataId, requestId, ts) {
    let parts = [];
    if (dataId !== undefined && dataId !== null && dataId !== '') {
        parts.push(`id:${dataId}`);
    }
    if (requestId !== undefined && requestId !== null && requestId !== '') {
        parts.push(`request-id:${requestId}`);
    }
    if (ts !== undefined && ts !== null && ts !== '') {
        parts.push(`ts:${ts}`);
    }
    return parts.join(';') + ';';
}

const conditionalManifest = buildConditionalManifest(DATA_ID, X_REQUEST_ID, TS);
testManifest('Conditional manifest (all present)', conditionalManifest, SECRET_STR);
testManifest('Conditional manifest (all present, hex secret)', conditionalManifest, SECRET_BUF);

console.log('\n' + '='.repeat(80));
console.log('TESTING WITH query.id INSTEAD OF query["data.id"]');
console.log('='.repeat(80));

// What if the query has both 'id' and 'data.id' and the wrong one is used?
// Query from logs: {"data.id":"165503479276","type":"payment"}
// The user's code does: req.query.id || req.query['data.id']
// req.query.id would be undefined, so it falls through to req.query['data.id'] which is correct

testManifest('Using "undefined" as dataId', 
    `id:undefined;request-id:${X_REQUEST_ID};ts:${TS};`, SECRET_STR);

console.log('\n' + '='.repeat(80));
console.log('TESTING SECRET ENCODING VARIATIONS');
console.log('='.repeat(80));

// What if the secret has a trailing newline or carriage return from .env?
testManifest('Secret with \\r\\n suffix', 
    `id:${DATA_ID};request-id:${X_REQUEST_ID};ts:${TS};`, SECRET_STR + '\r\n');

testManifest('Secret with \\n suffix', 
    `id:${DATA_ID};request-id:${X_REQUEST_ID};ts:${TS};`, SECRET_STR + '\n');

// What if the secret has a space at the end?
testManifest('Secret with trailing space', 
    `id:${DATA_ID};request-id:${X_REQUEST_ID};ts:${TS};`, SECRET_STR + ' ');

// What about base64?
testManifest('Secret as base64', 
    `id:${DATA_ID};request-id:${X_REQUEST_ID};ts:${TS};`, Buffer.from(SECRET_STR, 'base64'));

console.log('\n' + '='.repeat(80));
console.log('BRUTE FORCE: TRYING ALL POSSIBLE MANIFEST FORMATS');  
console.log('='.repeat(80));

const ids = [DATA_ID, ROOT_ID, '', undefined];
const secrets = [SECRET_STR, SECRET_BUF];
const trailingSemicolons = [true, false];
const dataIdFields = ['id', 'data.id'];

let found = false;
for (const id of ids) {
    for (const secret of secrets) {
        for (const trailing of trailingSemicolons) {
            for (const fieldName of dataIdFields) {
                // Standard format
                let manifest = '';
                if (id !== undefined && id !== '') {
                    manifest += `id:${id};`;
                }
                manifest += `request-id:${X_REQUEST_ID};ts:${TS}`;
                if (trailing) manifest += ';';
                
                const hmac = crypto.createHmac('sha256', secret);
                hmac.update(manifest);
                const sig = hmac.digest('hex');
                if (sig === TARGET_V1) {
                    console.log(`✅ MATCH FOUND!`);
                    console.log(`   id=${id}, secret=${typeof secret === 'string' ? 'string' : 'hex-buffer'}, trailing=${trailing}, field=${fieldName}`);
                    console.log(`   manifest: "${manifest}"`);
                    found = true;
                }

                // Also try with id at end
                let manifest2 = `request-id:${X_REQUEST_ID};ts:${TS}`;
                if (id !== undefined && id !== '') {
                    manifest2 += `;id:${id}`;
                }
                if (trailing) manifest2 += ';';
                
                const hmac2 = crypto.createHmac('sha256', secret);
                hmac2.update(manifest2);
                const sig2 = hmac2.digest('hex');
                if (sig2 === TARGET_V1) {
                    console.log(`✅ MATCH FOUND (id at end)!`);
                    console.log(`   id=${id}, secret=${typeof secret === 'string' ? 'string' : 'hex-buffer'}, trailing=${trailing}, field=${fieldName}`);
                    console.log(`   manifest: "${manifest2}"`);
                    found = true;
                }
            }
        }
    }
}

if (!found) {
    console.log('❌ No match found in brute force. The issue is likely the SECRET itself.');
    console.log('\n' + '='.repeat(80));
    console.log('REVERSE ENGINEERING: What secret would produce the target signature?');
    console.log('='.repeat(80));
    console.log('This is not computationally feasible for HMAC-SHA256.');
    console.log('\nMOST LIKELY CAUSES:');
    console.log('1. The secret in .env does NOT match the one in the MP Dashboard');
    console.log('2. The secret was REGENERATED after the webhook was configured');  
    console.log('3. The secret belongs to a DIFFERENT webhook URL configuration');
    console.log('4. There are invisible characters in the .env secret (BOM, zero-width chars)');
}

// Final diagnostic: Check for invisible characters in the secret
console.log('\n' + '='.repeat(80));
console.log('SECRET DIAGNOSTIC');
console.log('='.repeat(80));
console.log(`Secret length: ${SECRET_STR.length} chars`);
console.log(`Is valid hex: ${/^[0-9a-f]+$/i.test(SECRET_STR)}`);
console.log(`Char codes: ${Array.from(SECRET_STR).map(c => c.charCodeAt(0)).join(',')}`);
