/** 서비스 이름과 주소입니다. 공유 미리보기(OG)와 canonical은 절대 주소여야 해서 운영 주소를 씁니다. */
export const SITE = {
	name: 'V',
	url: 'https://v-ryushin01.vercel.app',
	title: 'V | 데스크·게이밍 셋업 배치도',
	description:
		'책상, 모니터, PC, 게임기, 의자, TV, 오디오, 콘센트를 실제 크기로 배치하고 동선과 전력을 점검합니다.',
	image: {
		path: '/og-image.jpg',
		width: 1200,
		height: 630,
		alt: '위쪽과 왼쪽 cm 룰러, "자로 재고 놓으세요." 제목과 예시 방 평면도가 있는 V 첫 화면'
	}
} as const;
