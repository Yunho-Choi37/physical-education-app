# Vercel API 프로젝트 환경 변수 설정

아래 값들을 Vercel API 프로젝트의 **Settings → Environment Variables**에 추가하세요.

## 필수 환경 변수 3개

### 1. FIREBASE_PROJECT_ID
```
l-existence-precede-l-essence
```

### 2. FIREBASE_CLIENT_EMAIL
```
firebase-adminsdk-fbsvc@l-existence-precede-l-essence.iam.gserviceaccount.com
```

### 3. FIREBASE_PRIVATE_KEY (⚠️ 한 줄로 복사)

**방법 1: 한 줄 형식 (권장 - Vercel에서 문제 없음)**
아래를 그대로 복사해서 붙여넣으세요 (모든 줄이 한 줄로 연결되어 있습니다):

```
-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCY+98kURLZ2A6x\nJb+XJUkI1guv2kNXEETYNCfMVdIY3USZe8Mok5grSuuygJBFpoDltkPQIM4djczJ\nitmO01xYhlXbxUUgUZZHdacI1P7R9LPxqB+crbBQRHzBrn9F6TgxxT3GUiXBjBip\n+7B7d5wfn7yb7Ya7MkSAID2LyPoXsprqwiZgAcWX83B+6ritOsxz5hCgRClIrVE9\n5qx3eGUwTlE2/k/fGomPCxv3d0AQhePaCnTvnZBGpX8whPDF/J7PiH4PFXcr/c9o\nScLCW4FaFRJ6VRXDzc8cXpb1vkMG7YlnkuPgWziKsthVwjjJrhNndNBEEJgSkgLP\nA7TlcmMLAgMBAAECggEADuatp/xroSNt3uxl2oOLtxwePE0+tOrFQefmnn0Xf0uC\nJI8NBdVGg6UDCzqBkv8yW+2iclHXscI/mbv4D/TfcFH5Z/QxlQHNaP15PR9+CJZU\ntquhFKJIY7EgE7967yTVz+c96qTSv6T1PA1jdctDPkNRXEDJGE+/o1lAlW6Iiak5\n4Zf1CKXLFTkkLTkRrRz2MDBrRwb06xEekGBvEErfjI0blkcFUl3XtnokkGEIIiFu\nsVoK0hf/tf4i/+NjtLQ7T67xpc6hetdjsG6yHXHJTLre7k0LNrlbGg1DWiaRmzga\nqUblwZtywszHZn6JOG/Ht9JHP1uRTgVQ50ni5g88pQKBgQDMvUxYMbQvFA6ARrBX\nrZ0cwPpjtAEgQ+7vkP6xbvStkK/wgzplr9JRpC7QxctYvZdzjAnokWS5m3xbDc/s\nAALlgCvTGsyFQU51Cb45Fcnr75POP+X7ljBWuwVSfLca+vabu4KfykM4oIsaXD1O\nXAwumf7eACImgO0s4Cfk6XIrDwKBgQC/SVGG2lA+3lvJ7SUHI7k5qygDKtqWkABO\nZ+iLYFfuRHUV9D9J9MPA9TuobvxZu3+Ud3CHtepS7eYb0CiiCPiABpWKimacKCDs\nsZVxAUA+guapV5HzloXWFeZLfoubjZH+MxG6eKjg4n5wBdVf5GYIgrVJcdZQntVD\neKRsEaa4RQKBgFBUAQ0lSy2hb+MSWQO9gUQTzumpaTuwi6GAwPz6rJMgjncN9a6J\n4jnX8epFgHfrwu05x3Vw/hT4lTzgWXCdvIUw2YD1JcMukUrILNMW4mdoUxR7647f\nKU4OCJOJjQnP50vIsQJiiCdCjfEkuYTyBnGOR/nwEXYL5YJS3DQrB3kvAoGBAIVr\nTzj+5r+i+mSySoRbT2NA1Sy4ZDRmBkCpyxIDxfEDwKLqdIZR+YOJyO2nU84GsGrO\nkCeoI+Np2XkGzICQPzuU3BMAi6dZefV9u51RYQz44oe087DyCTGUnseDYT7DFNQ3\nrKLia/BHKidaekRjGyPOf0HV68TZtChWamCSQzX9AoGADUo5xq9PGgiT43MToEe5\newwZvIbGsSDcaZD+kVzE4MNFH5jcqhbmZJlC5K0WM2B7BoJs1q91ANhE8k9L5maR\nF6Eex2Mwb8mNtkm80o+TXg5gaiT5a/+Jh6UY0Z24UIXJR9y/SBED7UYwUTMQj5Ob\nx3Xe5VhhKxoCE3dx6BC0gSo=\n-----END PRIVATE KEY-----
```

## 설정 방법

1. Vercel 대시보드 → **API 프로젝트** 선택
2. **Settings** → **Environment Variables** 클릭
3. 위의 3개 환경 변수를 각각 추가:
   - **Key**: `FIREBASE_PROJECT_ID` → **Value**: `l-existence-precede-l-essence`
   - **Key**: `FIREBASE_CLIENT_EMAIL` → **Value**: `firebase-adminsdk-fbsvc@l-existence-precede-l-essence.iam.gserviceaccount.com`
   - **Key**: `FIREBASE_PRIVATE_KEY` → **Value**: (위의 전체 private key 블록을 그대로 복사)

4. 각 환경 변수에 대해 **Production**, **Preview**, **Development** 모두 체크
5. 저장 후 **Redeploy** (자동 재배포가 안 되면 수동으로 재배포)

## 주의사항

- `FIREBASE_PRIVATE_KEY`는 위의 **한 줄 형식**을 그대로 복사해서 붙여넣으세요.
- `\n`은 줄바꿈 문자를 의미합니다 (코드에서 자동으로 변환됩니다).
- 환경 변수 추가 후 반드시 **재배포**해야 적용됩니다.

## 문제 해결

만약 여전히 오류가 발생하면:
1. Vercel에서 환경 변수를 삭제하고 다시 추가
2. 값 입력 시 **앞뒤 공백이 없도록** 주의
3. 저장 후 **Redeploy** 실행

