# 실제 모델 카탈로그

실제 제품은 `src/entities/plan/model/catalog-models.ts`에 있습니다. 값은 2026-11-10에 공개 자료로 확인했습니다. Antec Torque는 출처마다 축 표기가 달라, 두 출처가 맞는 깊이 621mm를 세로로 썼습니다. 제조사 공식 사양을 바로 찾지 못한 경우가 많아, 판매처와 사양 정리 사이트의 값이 서로 맞는지 확인해 넣었습니다. 출처마다 값이 달라 확인할 수 없는 제품(Secretlab TITAN Evo 의자 크기, KEF LSX II 전력, PS5 슬림 정격 전력 등)은 넣지 않거나 기준을 밝혔습니다.

배치 전에 실제 제품을 확인하고, 다르면 편집 화면의 규격 입력으로 고쳐 주세요.

## 측정 기준

- 가로×세로는 위에서 본 바닥 면적(cm)입니다. 화면은 스탠드를 포함하고, 게임기는 눕혀 놓은 상태입니다. Xbox Series X만 세운 상태입니다.
- 소비 전력은 제품마다 공개된 기준이 달라 함께 저장하고 편집 화면에 표시합니다.

| 기준          | 뜻                                                          |
| ------------- | ----------------------------------------------------------- |
| 최대          | 제조사·판매처가 표기한 최대 소비 전력                       |
| 정격          | 설명서·라벨의 정격 소비 전력                                |
| 일반 사용     | 판매처가 표기한 일반 사용 소비 전력. 최대보다 낮습니다      |
| 판매처 표기   | 최대인지 일반인지 밝히지 않은 값                            |
| 전원부·어댑터 | 내장 전원부 또는 어댑터의 정격. 실제 사용 전력보다 높습니다 |
| 실측          | 제조사 표기가 없어 리뷰 실측값을 쓴 경우                    |
| 추정·기본값   | PC 케이스처럼 구성에 따라 다르거나 표기가 없는 경우         |

## 모델

| 모델                                   | 가로×세로(cm)          | 전력(W)  | 기준        |
| -------------------------------------- | ---------------------- | -------- | ----------- |
| Samsung Odyssey OLED G9 49인치 (G95SC) | 119.5×23.7             | 220      | 최대        |
| LG UltraGear OLED 45인치 (45GR95QE)    | 99.3×36.3              | 160      | 최대        |
| Dell Alienware AW3423DWF               | 81.5×30.6              | 200      | 최대        |
| LG UltraGear OLED 27인치 (27GS95QE)    | 60.4×25.8              | 72       | 최대        |
| LG OLED evo C4 65인치                  | 144.0×23.1             | 145      | 일반 사용   |
| LG OLED evo C4 55인치                  | 122.2×23.0             | 114      | 일반 사용   |
| Samsung OLED S90D 65인치               | 144.5×26.4             | 375      | 최대        |
| Sony BRAVIA 8 II 65인치                | 144.3×33.9             | 397      | 판매처 표기 |
| PlayStation 5 Pro                      | 38.8×21.6              | 390      | 정격        |
| PlayStation 5 (슬림)                   | 35.8×21.6              | 216      | 실측        |
| Xbox Series X (세워 둠)                | 15.1×15.1              | 315      | 전원부      |
| Xbox Series S                          | 27.5×15.1              | 165      | 전원부      |
| Nintendo Switch 2 독                   | 20.1×5.1               | 60       | 어댑터      |
| Mac mini (M4)                          | 12.7×12.7              | 155      | 최대        |
| Mac Studio (2025)                      | 19.7×19.7              | 480      | 최대        |
| Lian Li O11 Dynamic EVO 케이스         | 28.5×46.5              | 550      | 추정        |
| NZXT H9 Flow 케이스                    | 29.0×49.5              | 550      | 추정        |
| Fractal Design North 케이스            | 21.5×46.9              | 550      | 추정        |
| IKEA UPPSPEL 게이밍 책상 180           | 180×80                 | 240      | 전원부      |
| Secretlab MAGNUS Pro / Pro XL          | 150×70 / 177×80        | 200      | 추정        |
| IKEA BESTÅ TV장 180                    | 180×42                 | -        | -           |
| Herman Miller Aeron (B 사이즈)         | 68.6×69.8              | -        | -           |
| Sonos Arc Ultra / Sub 4                | 117.8×11.1 / 40.2×15.8 | 40 / 120 | 기본값      |
| Samsung HW-Q990D 사운드바 / 서브우퍼   | 123.2×13.8 / 22.0×41.0 | 41 / 26  | 일반 사용   |
| Denon AVR-X1800H                       | 43.4×33.9              | 430      | 정격        |
| MacBook Air 13인치 (M4)                | 30.4×21.5              | 30       | 어댑터      |
| MacBook Air 15인치 (M4)                | 34.0×23.8              | 35       | 어댑터      |
| MacBook Pro 14인치                     | 31.3×22.1              | 70       | 어댑터      |
| MacBook Pro 16인치                     | 35.6×24.8              | 140      | 어댑터      |
| iMac 24인치 (M4)                       | 54.7×14.7              | 143      | 어댑터      |
| Apple Studio Display 27인치            | 62.3×16.8              | 21       | 일반 사용   |
| Antec Torque 오픈 프레임 케이스        | 28.5×62.1              | 550      | 추정        |

## 추가 모델 (2026-11-10)

사용자 보유·구매 후보 목록과 [futureterior](https://futureterior.com/) 커뮤니티를 참고해 추가했습니다. futureterior는 게시판 9개의 게시글 1,494개를 확인했고, 사진에 태그된 쇼핑몰 제품 76종의 상세 페이지 중 본문에 치수가 적힌 것은 8종뿐이었습니다.

- **추정 치수:** 편집 화면과 물건 목록에 '추정'으로 표시합니다. 제조사·판매처 치수를 찾지 못해 같은 종류의 비슷한 제품을 기준으로 잡은 값입니다. 실제 제품을 재서 규격 입력으로 고쳐 주세요.
- **확인한 치수:** G PRO X SUPERLIGHT 2 6.35×12.5, DeathAdder V2 Pro 6.2×12.7, Magic Mouse 5.71×11.35, Magic Keyboard 27.9×11.5, Kensington Pro Fit Ergo 버티컬 트랙볼 8.6×13.6, Wooting 80HE 34.6×14.2, Razer Strider Large 45×40, Katana V2 사운드바 60×9.5와 서브우퍼 15×36.7(어댑터 72W), Dell UP3216Q 75.0×21.4(최대 130W), BenQ ScreenBar Plus 45×9(USB 5W)
- **USB 전원:** 모니터 조명, DAC 등 USB로 전원을 받는 기기는 콘센트 점검에서 뺍니다.
- **대표 모델로 정한 항목:** SONY 라디오 → ICF-506, 마그네틱 거치대 → ESR HaloLock, 아스텔앤컨 신제품 → A&ultima SP3000, 소니 신제품 → NW-WM1ZM2, 피닉스 키보드 → Cable Car Designs의 Phoenix TKL 키보드 키트(F13 텐키리스, 앞 높이 20.3mm, 타이핑 각도 6.5°, [Daily Clack](https://dailyclack.com/products/phoenix-keyboard-kit), [Phoenix TKL 영상](https://www.youtube.com/watch?v=ukum7WCuwy8), [QMK 키보드 정의](https://git.paehr.dedyn.io/johannes/CherryQMKMod/src/branch/master/keyboards/cablecardesigns/phoenix)). 가로·세로는 공개되지 않아 F13 텐키리스 배열(18.25u×6.5u)과 얇은 베젤로 계산한 36.4×14.0cm 추정값, 화이트 최고 사양 PC → Lian Li O11 Vision 케이스 구성, 로지텍 G 최상위 파워플레이 호환 → G PRO X SUPERLIGHT 2, 칼디짓 독 → SOHO
- **넣지 않은 것:** 이어폰 케이블과 이어팁(바닥 배치에서 면적이 의미 없음), 이미 있는 모델(Odyssey OLED G9, PS5 Pro, Aeron B, Antec Torque, MacBook Pro 14·16, MacBook Air 13)
- **출처:** [Logitech G PRO X SUPERLIGHT 2(mousespecs)](https://mousespecs.org/logitech-g-pro-x-superlight-2), [DeathAdder V2 Pro(TechPowerUp)](https://techpowerup.com/review/razer-deathadder-v2-pro), [Magic Mouse(Apple)](https://support.apple.com/en-gb/111885), [Magic Keyboard(Dimensions)](https://dimensions.com/element/apple-magic-keyboard), [Kensington 트랙볼 리뷰](https://www.trackballmouse.org/?p=3154), [Wooting 80HE(Digital Trends)](https://digitaltrends.com/computing/wooting-80he-review), [Razer Strider(Review Geek)](https://www.reviewgeek.com/94785/razer-strider-mousepad-review-large-and-subdued/), [Katana V2(PCPer)](https://pcper.com/2022/09/creative-sound-blaster-katana-v2-gaming-soundbar-review/), [Dell UP3216Q 사용 설명서](https://dl.dell.com/manuals/all-products/esuprt_electronics/esuprt_display_projector/esuprt_display/dell-up3216q-monitor_User's%20Guide_en-us.pdf), [DisplayDB UP3216Q](https://displaydb.com/monitor/dell-ultrasharp-up3216q), [BenQ ScreenBar Plus](https://www.benq.eu/en-uk/lighting/monitor-light/screenbar-plus/spec.html), [IKEA UPPSPEL 설명서](https://www.ikea.com/us/en/manuals/uppspel-sit-stand-underframe-for-table-top-black__AA-2301012-3-100.pdf)

## futureterior 태그 제품 (2026-11-10)

[futureterior](https://futureterior.com/) 커뮤니티 사진에 태그된 제품 76종 중 67종을 넣었습니다. 쇼핑몰 상세 페이지는 사양이 대부분 이미지라, 본문 옵션에 적힌 치수와 제조사·판매처 자료를 썼습니다. 옵션으로 크기를 고르는 제품은 대표 크기 하나를 넣었으니, 다른 크기는 규격 입력으로 고쳐 주세요.

| 모델                                   | 가로×세로(cm)           | 전력(W) | 기준·출처                                          |
| -------------------------------------- | ----------------------- | ------- | -------------------------------------------------- |
| 오프레임 BARCO·LARGO 모션데스크        | 160×80                  | 200     | 추정 전력, 상판 1200~1800×700~800 옵션 중 1600×800 |
| 메이우드 Homage 원목 모션데스크        | 160×80                  | 200     | 추정 전력, 1400~2000×800 옵션 중 1600×800          |
| 브리드 패닉스 스탠딩 데스크 (Fenix30T) | 160×78                  | 200     | 추정 전력, 1400~2000×680~780 옵션 중 1600×780      |
| 큐데스크 스테인리스 데스크선반 컴팩트  | 75×22                   | -       | 판매처 상품 요약 (와이드형 115×22)                 |
| 메이우드 리놀리움 데스크매트 L         | 90×43                   | -       | 판매처 옵션 (M 80×40)                              |
| 헥스칼 펠트 마그네틱 풀커버 데스크매트 | 140×70                  | -       | 판매처 옵션 (1400~2000)                            |
| 오롯이제작소 천연 리놀륨 데스크매트    | 90×40                   | -       | 판매처 옵션 (80×35)                                |
| 오롯이제작소 두마루 손목 받침대        | 36×12.5                 | -       | 판매처 옵션 (길이 31~44, 폭 11·12.5)               |
| Kanto SP6HD 스피커 스탠드              | 17.8×21.6               | -       | Abt (7×8.5인치)                                    |
| BenQ ScreenBar Halo 2                  | 50×10.9                 | USB     | Adorama, BenQ 사양 (5V 3A, 최대 15W)               |
| Philips Hue Play 라이트 바             | 25.3×4.4                | 6.6     | 일반 사용, 판매처                                  |
| Philips Hue Play 월 워셔               | 9.1×7.6                 | 60      | 판매처 표기 (TechRadar, Wayfair)                   |
| Philips Hue 그라디언트 Signe 플로어    | 11.1×11.1               | 29      | 판매처 표기 (Toolstation, PB Tech)                 |
| Philips Hue 브릿지 프로                | 9.23×9.23               | 5       | 판매처 표기 (Harvey Norman)                        |
| Edifier QR65 액티브 / 패시브           | 14.15×21.68 / 13.0×21.2 | 65      | 판매처 표기 (Galaxus). 충전 출력일 수도 있음       |
| Edifier QR30 액티브 / 패시브           | 12.75×14.2 / 11.2×14.2  | 30      | 추정 전력 (출력 30W RMS)                           |
| KEF LSX II LT 주 / 보조 스피커         | 15.5×18.0               | 200     | 판매처 표기 동작 전력 (Music Direct)               |
| Marshall Acton III                     | 26×15                   | 60      | 추정 전력 (앰프 출력 60W), 치수는 Marshall         |
| Creative Pebble V2 (한 쪽)             | 11.6×11.5               | USB     | Creative 사양서 (5V 2A)                            |
| Corsair XENEON EDGE 14.5인치           | 37.2×12                 | USB     | Corsair (372×120mm)                                |
| Elgato Stream Deck +                   | 14.0×13.8               | USB     | 판매처 (140×138×110mm)                             |
| 8BitDo Micro                           | 7.2×4.1                 | -       | Nintendo Life (72×40.7mm)                          |
| Lofree Flow 2 (100키)                  | 39.8×12.6               | -       | 리뷰·판매처 (398.2×126mm)                          |
| Logitech G PRO X TKL RAPID             | 35.7×15.0               | -       | 판매처 (357×150mm)                                 |
| LiberNovo Omni                         | 74×79                   | -       | 판매처 (폭 74~79, 깊이 79.3), 제조사 받침 폭 54    |

- **추정 치수:** 오프레임 STILO·페노 선반(폭 1000 옵션, 깊이 추정), 메이우드 Prestige 선반, 일리안 모듈러 받침대, 1OFF 듀얼 모니터 선반, 브레스밋 오거나이저·키보드 진열대, 헥스칼 스튜디오 플러스(같은 회사 Hexcal Studio의 약 119×23cm를 기준), 헥스칼·브릭사 가죽 데스크매트, Fellowes 모니터암 두 종, 탱그램 이더 장스탠드, 무딕스 바이브폴, 후후루 블루밍코스터·뢰흐블루, Divoom 타임즈 프레임, VARO V108(풀배열 기준), Lofree Flow 2 for Mac(84키로 가정), 레니프 유니백체어 프로, 로우모 발받침대 두 종(LC99는 폭 51.2cm만 확인), LINAK DL6(상판 미포함 프레임이라 1200×700 상판 기준), 메이우드 거치대, 오아 3in1 충전기, 덱스탑 멀티탭 트레이, 트레이·코스터·디퓨저·시계·타이머·온습도계 등 소품, 버니언스 A2 액자
- **새 종류:** 데스크 선반·받침대와 스피커 스탠드는 책상 위에 깔리는 층이라 그 위에 모니터·스피커를 올려도 겹침이 아닙니다. 장스탠드는 바닥 물건, 월 워셔는 책상과 바닥 어디에나 둘 수 있는 조명입니다. 멀티탭 트레이는 책상 아래에 달려 책상 위 물건과 겹치지 않고, 액자는 벽에 붙습니다.
- **스피커 한 쌍:** 왼쪽·오른쪽을 따로 넣었습니다. 전원은 전원을 받는 쪽에만 있습니다.
- **넣지 않은 것:** 쇼핑몰 소개 페이지 3개, 오프라인 판매로 중복된 4개(Hue 브릿지 프로·월 워셔, 스크린바 헤일로 2, 마샬 액톤 3), 이미 있는 모델(델타허브 카르피오 2.0, 호버펜 2.0), 바닥 면적이 의미 없는 것(240W 충전 케이블, 키캡 세트, 룸 스프레이, 퍼퓸 사쉐)
- **출처:** [Edifier QR65(LDLC)](https://www.ldlc.com/en/product/PB00607603.html), [Edifier QR65(Galaxus)](https://galaxus.de/en/s1/product/edifier-qr65-pc-speakers-43353225), [Edifier QR30(LDLC)](https://www.ldlc.com/en/product/PB00666808.html), [KEF LSX II LT(Music Direct)](https://musicdirect.com/equipment/speakers/kef-lsx-ii-lt-wireless-bookshelf-speakers-pair), [Marshall Acton III](https://www.marshall.com/ba/en/product/acton-iii), [Creative Pebble V2](https://nordic.creative.com/p/speakers/creative-pebble-v2), [Kanto SP6HD(Abt)](https://www.abt.com/Kanto-Black-SP6HD-Elevated-Desktop-Speaker-Stands-Pair-SP6HD/p/184854.html), [BenQ ScreenBar Halo 2 사양](https://www.benq.com/th-th/lighting/monitor-light/screenbar-halo-2/spec.html), [ScreenBar Halo 2(Adorama)](https://www.adorama.com/benq-screenbar-halo-2-monitor-light-bar-wireless-controller/p/bq9hw4pwtwc1), [Corsair XENEON EDGE](https://www.corsair.com/ca/en/p/monitors/cc-9011306-ww/xeneon-edge-14-5-lcd-touchscreen-cc-9011306-ww), [Hue Play 라이트 바(Datek)](https://store.datek.co.uk/philips-hue-white-and-colour-ambience-play-light-bar-single-pack-915005734401), [Hue Play 월 워셔(TechRadar)](https://www.techradar.com/home/smart-lights/philips-hue-play-wall-washer-review), [Hue Signe(Toolstation)](https://www.toolstation.com/philips-hue-signe-gradient-led-smart-floor-lamp/p32470), [Hue 브릿지 프로(Harvey Norman)](https://www.harveynorman.co.nz/networking-smart-home-and-home-phones/smart-home/smart-lighting/philips-hue-bridge-pro-for-hue-lights-white-hue582605.html), [Stream Deck +(Dateks)](https://www.dateks.lv/en/cenas/pc-aksesuari/920179-elgato-stream-deck-?vat=0), [8BitDo Micro(Nintendo Life)](https://nintendolife.com/news/2023/08/8bitdo-unveils-new-micro-switch-controller-available-in-blue-and-green), [Lofree Flow 2 100(syskb)](https://syskb.com/lofree-flow-2-100-le-format-96-en-aluminium-pour-ceux-qui-ne-lachent-pas-le-pave-numerique/), [G PRO X TKL RAPID(Alza)](https://www.alza.hu/logitech-g-pro-x-tkl-rapid-white-us-intl-d12718090.htm), [LiberNovo 치수 안내](https://ca.libernovo.com/blogs/news/ergonomic-chair-for-small-apartments-compact-solutions-that-dont-compromise), [LiberNovo Omni(Digitec)](https://www.digitec.ch/en/s1/product/libernovo-omni-48-43-55-cm-office-chairs-66021303), [Hexcal Studio](https://hexcal.com/blogs/news/this-workstation-hexcal-studio-offers-a-clever-way-to-organize-and-power-your-deskspace), [로우모 LC99(Makuake)](https://www.makuake.com/project/dualrestlc99/), [Fellowes Tallo 1FM 제품 시트](https://assets.fellowes.com/manuals/07233_SellSheet_8616101_8615101_8613501_Tallo_1FM_EU.pdf), [LINAK DL6 EXPERIENCE](https://www.linak.com/products/lifting-columns/dl6-experience), 판매처 옵션 치수는 각 [futureterior 상품 페이지](https://futureterior.com/)

## 일러스트

실제 모델은 `src/entities/plan/ui/model-glyphs.ts`에서 위에서 본 모습을 따로 그립니다. 곡면 화면의 곡률(G9 1000R, 45인치 800R, AW3423DWF 1800R), 스탠드와 받침 모양, 통풍구, 패널 분할처럼 위에서 알아볼 수 있는 특징을 선으로 옮겼고, 제조사 로고는 그리지 않습니다. 사용자가 치수를 바꿔도 비율대로 늘어납니다.

새 모델을 추가할 때는 사양 확인과 출처 기록, 모델별 일러스트를 함께 만듭니다.

## 출처

- Samsung G95SC: [Multitronic](https://multitronic.fi/en/products/4584341/samsung-odyssey-oled-g9-g95sc-49--dual-qhd--oled--240hz-curved-gamingskarm), [Stock in the Channel](https://sandbox.stockinthechannel.com/Product/Samsung-G95SC-computer-monitor-124-5-cm-49-5120-x-1440-pixels-Dual-QHD-OLED-Silver/12598574)
- LG 45GR95QE: [Computer Alliance](https://www.computeralliance.com.au/45-lg-ultragear-45gr95qe-b-oled-qhd-240hz-curved-gaming-monitor), [DisplayDB](https://www.displaydb.com/monitor/lg-45gr95qe)
- Dell AW3423DWF: [DisplaySpecifications](https://www.displayspecifications.com/en/model/1c722e8e), [Icecat](https://icecat.fr/amp/p/vendorName/mpn/desc-108293637.html)
- LG 27GS95QE: [LG 사양서(PC Richard)](https://static.pcrichard.com/docs/27GS95QE-B_Specifications-Sheet_01.pdf), [DisplaySpecifications](https://www.displayspecifications.com/en/model/ed1a3732)
- LG C4: [DisplaySpecifications 65](https://www.displayspecifications.com/en/model/1b82389c), [DisplaySpecifications 55](https://www.displayspecifications.com/en/model/70bb389d), [Costco 지원](https://productsupport.costco.com/customer/device/LG/2024OLED65C4AUAOLEDevoC4Series)
- Samsung S90D: [HDTV Magazine](https://www.hdtvmagazine.com/equipment/tvs/samsung/qn65s90dafxza/), [D&S Appliances](https://dshomeappliances.com/products/samsung-qn65s90dafxza)
- Sony BRAVIA 8 II: [Sony Asia 사양](https://www.sony-asia.com/bravia/products/bravia-8m2/spec), [Fullspecs](https://fullspecs.net/smart-tv/sony/k-65xr80m2-specifications/)
- PS5 Pro: [Video Games Chronicle](https://www.videogameschronicle.com/news/the-official-playstation-5-pro-specifications-have-been-revealed), [Instant Gaming](https://news.instant-gaming.com/en/articles/9112-here-are-the-official-technical-specs-of-the-ps5-pro)
- PS5 슬림: [Gematsu](https://gematsu.com/2023/10/ps5-slim-models-launch-in-november), [NoobFeed 실측](https://www.noobfeed.com/articles/ps5-slim-2100-review-design-less-storage)
- Xbox Series X·S: [Wikipedia](https://en.wikipedia.org/wiki/Xbox_Series_X_and_Series_S), [iFixit 분해](https://documents.cdn.ifixit.com/pdf/ifixit/guide_138451_en.pdf), [ChargerLAB 165W 전원부](https://www.chargerlab.com/teardown-of-165w-power-supply-for-microsoft-xbox-series-s/)
- Nintendo Switch 2 독: [Nintendo 기술 사양](https://nintendo.com/en-ca/gaming-systems/switch-2/tech-specs), [Nintendo Life](https://www.nintendolife.com/guides/nintendo-switch-2-dock-size-hdmi-connections-guide-4k-upscale-rumours)
- Mac mini·Mac Studio: [YugaTech Mac mini](https://www.yugatech.com/spec/mac-mini-m4/), [YugaTech Mac Studio](https://www.yugatech.com/spec/apple-mac-studio-2025/)
- PC 케이스: [Lian Li O11 EVO 리뷰(TechPowerUp)](https://techpowerup.com/review/lian-li-o11-dynamic-evo), [비교(Galaxus)](https://www.galaxus.fr/en/s1/producttype/pc-case-77/compare/nzxt-h9-flow-vs-lian-li-o11d-evo-rgb-5855), [Fractal North 비교](https://frontdeskreview.com/gear/pc-cases/lian-li-o11-dynamic-evo-vs-fractal-design-north/)
- IKEA UPPSPEL: [IKEA](https://www.ikea.com/gb/en/p/uppspel-styrspel-gaming-desk-and-chair-black-grey-red-s19492700)
- Secretlab MAGNUS Pro: [Secretlab](https://secretlab.co/pages/magnus-pro)
- IKEA BESTÅ: [IKEA](https://www.ikea.com/gb/en/p/besta-tv-bench-with-drawers-and-door-white-lappviken-dark-grey-s69572978)
- Herman Miller Aeron: [Herman Miller 제품 모델](https://www.hermanmiller.com/en_gb/resources/3d-models-and-planning-tools/product-models/individual/aeron-chair-b-size-fully-adjustable-arms/), [Herman Miller Store](https://store.hermanmiller.com/office-chairs-aeron?lang=en_US)
- Sonos Arc Ultra·Sub 4: [B&H](https://www.bhphotovideo.com/c/product/1865279-REG/sonos_arc_ultra_soundbar.html/specs), [Sonos Sub 4](https://www.sonos.com/en-au/shop/sub-4)
- Samsung HW-Q990D: [Coolblue](https://www.coolblue.nl/en/product/946981/samsung-hw-q990d-2024.html), [사양서(Secomp)](https://www.secomp.ch/media/pdf/s05/05050263_en_data_2024.pdf)
- Denon AVR-X1800H: [Denon](https://www.denon.com/en/product/av-receivers/avr-x1800h/AVRX1800H.html)
- MacBook Air M4: [Multitronic 13인치](https://www.multitronic.fi/en/products/4466736), [Appalachian State 15인치](https://campusstore.appstate.edu/15-MA), [iDownloadBlog 15인치 사양](https://www.idownloadblog.com/?p=1030029)
- MacBook Pro 14·16인치: [Apple 사양](https://apple.com/uk/macbook-pro/specs), [iDownloadBlog 16인치](https://www.idownloadblog.com/?p=1017598)
- iMac 24인치: [Apple 사양](https://hn.jakechampion.name/reader/https://www.apple.com/imac-24/specs), [Multitronic](https://multitronic.fi/en/products/4408291)
- Apple Studio Display: [Apple 사양](https://apple.com/kg/studio-display/specs)
- Antec Torque: [TechPowerUp](https://www.techpowerup.com/248923/antec-presents-futuristic-angular-frame-open-air-chassis), [bit-tech](https://bit-tech.net/reviews/tech/cases/antec-torque-review/1/)
