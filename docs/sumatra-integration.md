# Integrasi Sumatra Level 1–20

Sumber: `referensiasset/BaraRimba_Sumatra_30_Level_Plan/`. Game Jawa (Phaser 3 + Matter, data-driven `LevelDef`) diperluas; tidak ada game paralel.

## 1. Audit repository (sebelum perubahan)

| Bagian | Isi |
| --- | --- |
| Teknologi | Phaser 3.90 (Matter), TypeScript, Vite 6, Playwright |
| Sistem level | `src/config/levels.ts`: array `LEVELS` (id 1–15), dimuat `LevelScene` via `scene.restart({ level })` |
| Loader aset | `src/config/level.ts` `ASSETS` + `ASSET_GROUPS`; `LevelScene.preload` hanya memuat grup yang dipakai level |
| Mekanik | truk + meriam 4 sambungan, `WaterSystem` (tetesan, aliran, kolam), `FireSystem` (partikel, menjalar), props Matter, gerbang/sakelar/tangki (`Puzzles`), kincir, cekungan, jungkat-jungkit, boss |
| UI | `GameUI` (menu, Peta Indonesia, papan level, HUD, jeda, pengaturan, hasil), progres `localStorage` |

## 2. Audit aset referensi

Alpha diukur ulang per file (bukan dari tampilan checkerboard).

| Paket | Jenis | Alpha | Keputusan |
| --- | --- | --- | --- |
| Level 1 `Production_Sprites/sprites/*.png` (75) | cutout individual dari sheet | nyata (0–255), sisa tepi 1 px | dipakai; alpha < 24 dibuang; beberapa label kategori salah (mis. 063/065 batu, 068 gajah) |
| Level 1 `source/original_sprite_sheet.png` | sprite sheet | nyata | sumber cutout di atas |
| Level 2 `sprite_sheet_source_rgba.png` | sprite sheet | nyata (maks 254) | dipotong per komponen alpha; serpihan tetangga dibuang |
| Level 2 `reference/*.png` | gambar gameplay komposit | RGB | referensi tata letak saja |
| Level 3–10 `reference/*.png` | poster komposit (panel + teks) | opak atau alpha seragam palsu (L3: 164–251, L4: 16–252) | referensi saja |
| Level 3–10 `sprites/*/…_reference.png` | crop kategori ~300×230 px dari poster | opak / tidak bermakna | **tidak layak sebagai sprite**; hanya hewan berkontur gelap (harimau L4, rusa L8) dipisahkan dari latar abu terang dan diverifikasi |

Hasil: `scripts/prepare_sumatra.py` → 72 sprite `public/assets/sumatra/*.webp` + 4 potret `public/assets/animals/` (anak-gajah, tapir, harimau, rusa-sumatra). Manifest dan statistik alpha: `docs/asset-manifest-sumatra.json`. Skrip menolak mengekspor gambar tanpa piksel transparan.

## 3. Pemetaan aset ke level

| Level | Misi | Aset baru (Sumatra) | Aset Jawa yang dipakai ulang |
| --- | --- | --- | --- |
| 2-1 Batu Pembuka | dorong batu → pintu goa | batu lumut, pintu batu ukir, katrol, bendera, anak gajah (3 pose), tebing/stalaktit | truk, air, api, tombol |
| 2-2 Rakit Penyelamat | rakit melawan arus, feri | rakit, tapir (3 pose), air terjun, palem | truk, air, api |
| 2-3 Katrol Beban Ganda | timbangan katrol | katrol, balok | orangutan |
| 2-4 Pantulan Semburan | panel pemantul + pengunci terbakar | jembatan tali, harimau (3 pose) | — (panel digambar: kayu + kaca) |
| 2-5 Bak Air Pengangkat | bak, katup, lift | balok, katrol | beruang madu |
| 2-6 Kincir Arus Goa | kincir → rantai pintu, batu ke lubang | pintu batu, batu | kincir (`gear`), orangutan |
| 2-7 Jembatan Jatuh | dua pengunci, batu penahan, ayunan | jembatan tali, harimau | — |
| 2-8 Bendungan Gambut | bendungan, dua katup, parit | rusa sambar (2 pose), pintu batu | tombol |
| 2-9 Rantai Penyelamatan Gajah | urutan api → kayu berengsel → batu | anak gajah, pintu batu | tombol |
| 2-10 Akar Jembatan | siram ujung akar yang tumbuh menyeberang; layu bila kering | akar digambar, batu tebing | trenggiling |
| 2-11 Giring Rusa | rusa lari menjauhi cipratan; giring dari belakang | lorong goa rendah | — |
| 2-12 Runtuhan Stalaktit | runtuhkan 3 stalaktit: timbun lubang, hancurkan barikade, tekan batu pemicu | stalaktit, tumpukan batu | babi hutan, tombol |
| 2-13 Sekat Bakar Gambut | bara gambut merambat; basahi 2 semak di depannya | bara, semak | — |
| 2-14 Pancing Madu | putuskan tali sarang madu yang berayun untuk memancing beruang | sarang madu digambar | beruang madu |
| 2-15 Hujan Bara | kawal gajah; tembak bara jatuh / padamkan api yang ditimbulkan | retakan atap digambar | — |
| 2-16 Tanggul Lumpur | kikis tanggul lumpur → banjir memadamkan api terowongan | gundukan lumpur | tangki (reservoir) Jawa, berang-berang |
| 2-17 Lori Terbakar | padamkan api pada lori yang berayun di lembah rel | lori & rel digambar | — |
| 2-18 Sarang Rangkong | padamkan api tanpa membasahi sarang | sarang digambar | rangkong |
| 2-19 Kereta Gantung | kincir dua arah: kirim kereta, jemput orangutan, tarik pulang | kabel, kereta, tiang | kincir |
| 2-20 Duel Tekanan Goa Api | perisai dari dua tungku api yang dinyalakan ulang | bara | boss, bola api, HUD boss, orangutan-sit |

## 4. Kekurangan aset (tidak diganti aset fiktif)

- **Penjaga Goa (boss Level 10)**: tidak ada sprite. Crop `07_penjaga_goa` hanya berisi orangutan; wajah bos di poster menyatu dengan latar lava. Level 2-10 memakai karakter dan HUD boss Jawa (Pembakar Hutan) apa adanya.
- Beruang madu, orangutan, rusa L5/L6/L3: crop poster terlalu kecil/opak; dipakai sprite Jawa yang sudah ada.
- Panel pemantul, katup, pipa, bak, rantai, saluran: hanya ada di crop poster opak → digambar dari balok/katrol Sumatra + grafis sederhana.
- Tidak ada audio baru; tidak ada latar parallax Sumatra terpisah (latar goa disusun dari stalaktit, air terjun, palem, pakis Level 1–2).
- Harimau/rusa hasil pemisahan berukuran ~110–145 px (setara sprite hewan Jawa) — layak, tetapi sumber resolusi tinggi tetap disarankan.

## 5. Implementasi

- Region: `REGIONS` (`jawa` 1–15, `sumatra` 16–25, kode `2-1…2-10`); kartu Sumatra di Peta Indonesia terbuka; level pertama tiap region terbuka, berikutnya terbuka berurutan.
- Tema `cave` di `World` (latar goa, tanah dari batu tebing L1, batu lumut untuk props batu).
- `src/scenes/Sumatra.ts`: rakit, timbangan katrol, panel pemantul (air memantul di `WaterSystem`), pengunci terbakar, jembatan berengsel dengan batu penahan dan derek pemulihan, bak + katup + lift, pintu rantai kincir, lubang yang terisi batu, pemulihan batu yang hilang, perisai boss.
- Penyelamatan: `Animal` berjalan ke bendera (menunggu di api/pintu/celah/batu); menang = semua api padam + satwa sampai bendera.
- Sistem yang dipakai ulang tanpa duplikasi: truk, meriam, air, api, fisika Matter, kamera, HUD, jeda, pengaturan, menang/kalah, reset (`scene.restart`), boss + meter tekanan.

## 6. Status level dan verifikasi

Semua level diuji pada scene asli: `tests/sumatra-solutions.spec.ts` memutar ulang solusi tiap level **hanya dengan tombol pemain** (D, W/S, Q/E, Spasi; waktu dipercepat) dan memastikan menang, satwa tiba, semua api padam, tanpa error halaman. `tests/sumatra.spec.ts` memainkan 2-1 secara real-time dengan keyboard, menguji papan Sumatra, dan reset 2-1 serta 2-7.

| Level | Status |
| --- | --- |
| 2-1 … 2-9 | dapat dimainkan dan diselesaikan (`tests/sumatra-solutions.spec.ts`) |
| 2-10 … 2-20 | dapat dimainkan dan diselesaikan (`tests/sumatra-trials.spec.ts`, pemain berskrip yang hanya menekan tombol) |

Batasan: keseimbangan kesulitan dan rasa permainan belum diuji pemain manusia; solusi teruji membuktikan dapat diselesaikan, bukan bahwa tingkat kesulitannya ideal.
