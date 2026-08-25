# 한끼칼로리

음식 사진을 올리면 OpenAI Vision이 칼로리·탄단지를 추정하고, 같은 사진으로 레시피를 만들 수 있습니다. 식단 기록(또는 최근 분석)을 보고 부족한 영양을 추천하며, 셀카를 식사 장면 이미지로 바꿀 수 있습니다.

스택: Next.js 15 · Supabase · OpenAI · Vercel

## 로컬 실행

```bash
cp .env.example .env.local
npm install
npm run dev
```

`.env.local`에 다음을 채웁니다.

| 변수 | 설명 |
| --- | --- |
| `OPENAI_API_KEY` | OpenAI API 키 |
| `OPENAI_MODEL` | 기본 `gpt-4o-mini` (더 정확하면 `gpt-4o`) |
| `OPENAI_IMAGE_MODEL` | 셀카 변환용. 기본 `gpt-image-1-mini` (얼굴 유지가 더 필요하면 `gpt-image-1`) |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon / publishable 키 |

## Supabase 설정

1. [Supabase](https://supabase.com)에서 프로젝트를 만듭니다.
2. SQL 에디터에 [`supabase/migrations/20260825113537_init_meals.sql`](supabase/migrations/20260825113537_init_meals.sql) 내용을 실행하거나, CLI로 `supabase link` 후 `supabase db push` 합니다.
3. Authentication → URL Configuration
   - Site URL: `http://localhost:3000` (배포 후 Vercel URL)
   - Redirect URLs: `http://localhost:3000/auth/callback`, `https://<project>.vercel.app/auth/callback`
4. (선택) Authentication → Providers → Google을 켜고 Client ID / Secret을 넣습니다.
5. Storage 버킷 `meal-photos`는 마이그레이션에서 생성됩니다. 비공개이며 본인 폴더만 접근합니다.

## Vercel 배포

1. 이 저장소를 Vercel에 연결합니다.
2. 환경 변수에 `.env.example`과 같은 키를 넣습니다.
3. 분석 API 타임아웃은 `maxDuration` 60초입니다.
4. 배포 후 Supabase Redirect URL에 `https://<project>.vercel.app/auth/callback`을 추가합니다.

## 주의

결과는 사진 기반 **추정**입니다. 의료·영양 상담이 아니며, 가려진 음식·양 오차로 값이 달라질 수 있습니다.
