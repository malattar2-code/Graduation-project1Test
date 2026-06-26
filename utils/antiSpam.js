const dns = require('dns').promises;
const https = require('https');
const querystring = require('querystring');

// ── 1. FREE: Disposable email domains (static curated list) ───────────────
const DISPOSABLE_DOMAINS = new Set([
  'tempmail.com','throwaway.com','mailinator.com','guerrillamail.com',
  'yopmail.com','sharklasers.com','getairmail.com','10minutemail.com',
  'temp-mail.org','fakeinbox.com','burnermail.io','tempmailaddress.com',
  'mailnesia.com','tempmailo.com','disposableemail.com','emailondeck.com',
  'tempmailin.com','tmail.ws','maildrop.cc','harakirimail.com',
  'mailcatch.com','tempmail.net','fake-email.com','tempmail.ninja',
  'tmpmail.org','throwawaymail.com','trashmail.com','mytrashmail.com',
  'mailforspam.com','spamgourmet.com','boun.cr','crazymailing.com',
  'discard.email','discardmail.com','e4ward.com','gustr.com','inbox.si',
  'jetable.org','kasmail.com','link2mail.net','mailexpire.com',
  'mailismagic.com','mailshell.com','mailtemp.info','mintemail.com',
  'moburl.com','mt2009.com','mypartyclip.de','nervmich.net','nervtmich.net',
  'netmails.com','noclickemail.com','nospam4.us','nospamfor.us',
  'notmailinator.com','pookmail.com','proxymail.eu','punkass.com',
  'putthisinyourspamdatabase.com','quickinbox.com','recode.me',
  'rtrtr.com','s0ny.net','safetymail.info','sandelf.de','saynotospams.com',
  'shiftmail.com','shitmail.me','slopsbox.com','smellfear.com',
  'sofortmail.de','sogetthis.com','spam.la','spambob.com','spambob.net',
  'spambob.org','spambox.info','spambox.irishspringrealty.com',
  'spambox.us','spamcannon.com','spamcannon.net','spamcon.org',
  'spamcorptastic.com','spamcowboy.com','spamcowboy.net','spamcowboy.org',
  'spamday.com','spamex.com','spamfree24.com','spamfree24.de',
  'spamfree24.eu','spamfree24.info','spamfree24.net','spamfree24.org',
  'spamgourmet.net','spamgourmet.org','spamherelots.com',
  'spamhereplease.com','spamhole.com','spamify.com','spaminator.de',
  'spamkill.info','spaml.com','spaml.de','spammotel.com','spamobox.com',
  'spamoff.de','spamslicer.com','spamspot.com','spamthis.co.uk',
  'spamthisplease.com','spamtrail.com','supergreatmail.com','supermailer.jp',
  'suremail.info','teewars.org','teleworm.com','tempalias.com',
  'tempe-mail.com','tempemail.biz','tempemail.com','tempemail.net',
  'tempinbox.co.uk','tempinbox.com','tempmail.it','tempmail2.com',
  'tempmailer.com','tempmailer.de','tempomail.fr','temporarily.de',
  'temporarioemail.com.br','temporaryemail.net','temporaryforwarding.com',
  'temporaryinbox.com','thanksnospam.info','thrott.com','throwawayemailaddress.com',
  'tilien.com','tmailinator.com','toomail.biz','tradermail.info','trash-amil.com',
  'trash-mail.at','trash-mail.com','trash-mail.de','trash-mail.ga',
  'trash-mail.gq','trash2009.com','trashdevil.com','trashdevil.de',
  'trashemail.de','trashmail.at','trashmail.com','trashmail.de',
  'trashmail.me','trashmail.net','trashmail.org','trashmail.ws',
  'trashymail.com','trashymail.net','trbvm.com','trillianpro.com',
  'turual.com','twinmail.de','tyldd.com','uggsrock.com','upliftnow.com',
  'uplipht.com','venompen.com','veryrealemail.com','viditag.com',
  'viewcastmedia.com','viewcastmedia.net','viewcastmedia.org','webm4il.info',
  'wegwerfadresse.de','wegwerfemail.com','wegwerfemail.de','wegwerfmail.de',
  'wegwerfmail.net','wegwerfmail.org','wetrainbayarea.com','wetrainbayarea.org',
  'wh4f.org','whyspam.me','willselfdestruct.com','winemaven.info',
  'wronghead.com','wuzup.net','wuzupmail.net','wwwnew.eu','xagloo.com',
  'xemaps.com','xents.com','xmaily.com','xoxy.net','yep.it',
  'yogamaven.com','yopmail.fr','yopmail.net','ypmail.webarnak.fr.eu.org',
  'yuurok.com','z1p.biz','za.com','zehnminutenmail.de','zippymail.info',
  'zoaxe.com','zoemail.com','zoemail.net','zoemail.org','zomg.info'
]);

// ── 2. FREE: Verify domain MX records (built-in Node.js dns) ────────────
async function hasValidMX(email) {
  const domain = email.split('@')[1];
  if (!domain) return false;
  try {
    const mx = await dns.resolveMx(domain);
    return mx && mx.length > 0;
  } catch {
    return false;
  }
}

// ── 3. FREE: Random / gibberish name detection ──────────────────────────
function isGibberishName(name) {
  if (!name || name.length < 3) return false;
  const cleaned = name.toLowerCase().replace(/[^a-z]/g, '');
  if (cleaned.length < 3) return false;

  // Vowel ratio (normal names usually 20-60%)
  const vowels = (cleaned.match(/[aeiou]/g) || []).length;
  const ratio = vowels / cleaned.length;
  if (ratio < 0.15 || ratio > 0.7) return true;

  // Repeating chars (aaa, bbb)
  if (/(.)\1{2,}/.test(cleaned)) return true;

  // Keyboard walks
  const walks = ['qwerty','asdf','zxcv','qazwsx','wasd','poiuy','lkjh','mnbvc','1234','5678'];
  for (const w of walks) if (cleaned.includes(w)) return true;

  // High entropy in short strings
  if (cleaned.length <= 6) {
    let changes = 0;
    for (let i = 1; i < cleaned.length; i++) {
      if (cleaned[i] !== cleaned[i - 1]) changes++;
    }
    if (changes / (cleaned.length - 1) > 0.95) return true;
  }

  // Excessive consonant clusters
  if (/[^aeiou]{5,}/.test(cleaned)) return true;

  return false;
}

// ── 4. FREE: Spam score system ──────────────────────────────────────────
function calculateSpamScore({ email, firstName, lastName, charityName, userType }) {
  let score = 0;
  const reasons = [];
  const domain = email.split('@')[1]?.toLowerCase() || '';
  const local = email.split('@')[0] || '';

  // Disposable domain
  if (DISPOSABLE_DOMAINS.has(domain)) {
    score += 50;
    reasons.push('Disposable email domain');
  }

  // Gibberish name
  const fullName = userType === 'charity'
    ? (charityName || '')
    : `${firstName || ''} ${lastName || ''}`.trim();
  if (fullName && isGibberishName(fullName)) {
    score += 30;
    reasons.push('Random/gibberish name detected');
  }

  // Numeric-only local part
  if (/^\d+$/.test(local)) {
    score += 20;
    reasons.push('Numeric-only email local part');
  }

  // Very long local part
  if (local.length > 30) {
    score += 10;
    reasons.push('Suspiciously long email local part');
  }

  // Suspicious TLDs
  const badTLDs = ['.tk','.ml','.ga','.cf','.top','.xyz','.work','.date','.racing','.loan','.men','.gq','.click','.link'];
  if (badTLDs.some(tld => domain.endsWith(tld))) {
    score += 15;
    reasons.push('Suspicious/free domain TLD');
  }

  return {
    score,
    reasons,
    blocked: score >= 60,
    flagged: score >= 30 && score < 60
  };
}

// ── 5. FREE: reCAPTCHA v2 verification (built-in https, no extra lib) ───
function verifyRecaptcha(token, secretKey) {
  return new Promise((resolve) => {
    if (!token || !secretKey) return resolve(false);
    const data = querystring.stringify({ secret: secretKey, response: token });
    const req = https.request({
      hostname: 'www.google.com',
      port: 443,
      path: '/recaptcha/api/siteverify',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(data)
      }
    }, (res) => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => {
        try { resolve(JSON.parse(body).success === true); }
        catch { resolve(false); }
      });
    });
    req.on('error', () => resolve(false));
    req.write(data);
    req.end();
  });
}

module.exports = {
  hasValidMX,
  isGibberishName,
  calculateSpamScore,
  verifyRecaptcha
};