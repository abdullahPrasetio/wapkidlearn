package reading

// Passage is a reading text shown to child for practice.
// Type: "word" | "sentence" | "story"
type Passage struct {
	ID         string `json:"id"`
	GradeLevel int    `json:"grade_level"`
	Type       string `json:"type"`
	Title      string `json:"title"`
	Emoji      string `json:"emoji"`
	Body       string `json:"body"`
	WordCount  int    `json:"word_count"`
}

// wordPassages: satu kata per huruf A-Z, dengan emoji.
var wordPassages = []Passage{
	{ID: "w-a", Type: "word", Title: "Apel", Emoji: "🍎", Body: "Apel", WordCount: 1},
	{ID: "w-b", Type: "word", Title: "Buku", Emoji: "📚", Body: "Buku", WordCount: 1},
	{ID: "w-c", Type: "word", Title: "Cicak", Emoji: "🦎", Body: "Cicak", WordCount: 1},
	{ID: "w-d", Type: "word", Title: "Domba", Emoji: "🐑", Body: "Domba", WordCount: 1},
	{ID: "w-e", Type: "word", Title: "Elang", Emoji: "🦅", Body: "Elang", WordCount: 1},
	{ID: "w-f", Type: "word", Title: "Foto", Emoji: "📷", Body: "Foto", WordCount: 1},
	{ID: "w-g", Type: "word", Title: "Gajah", Emoji: "🐘", Body: "Gajah", WordCount: 1},
	{ID: "w-h", Type: "word", Title: "Harimau", Emoji: "🐯", Body: "Harimau", WordCount: 1},
	{ID: "w-i", Type: "word", Title: "Ikan", Emoji: "🐟", Body: "Ikan", WordCount: 1},
	{ID: "w-j", Type: "word", Title: "Jeruk", Emoji: "🍊", Body: "Jeruk", WordCount: 1},
	{ID: "w-k", Type: "word", Title: "Kucing", Emoji: "🐱", Body: "Kucing", WordCount: 1},
	{ID: "w-l", Type: "word", Title: "Lumba-lumba", Emoji: "🐬", Body: "Lumba-lumba", WordCount: 1},
	{ID: "w-m", Type: "word", Title: "Mangga", Emoji: "🥭", Body: "Mangga", WordCount: 1},
	{ID: "w-n", Type: "word", Title: "Nanas", Emoji: "🍍", Body: "Nanas", WordCount: 1},
	{ID: "w-o", Type: "word", Title: "Onta", Emoji: "🐪", Body: "Onta", WordCount: 1},
	{ID: "w-p", Type: "word", Title: "Panda", Emoji: "🐼", Body: "Panda", WordCount: 1},
	{ID: "w-r", Type: "word", Title: "Rusa", Emoji: "🦌", Body: "Rusa", WordCount: 1},
	{ID: "w-s", Type: "word", Title: "Singa", Emoji: "🦁", Body: "Singa", WordCount: 1},
	{ID: "w-t", Type: "word", Title: "Tikus", Emoji: "🐭", Body: "Tikus", WordCount: 1},
	{ID: "w-u", Type: "word", Title: "Ular", Emoji: "🐍", Body: "Ular", WordCount: 1},
	{ID: "w-v", Type: "word", Title: "Voli", Emoji: "🏐", Body: "Voli", WordCount: 1},
	{ID: "w-w", Type: "word", Title: "Wortel", Emoji: "🥕", Body: "Wortel", WordCount: 1},
	{ID: "w-x", Type: "word", Title: "Xilofon", Emoji: "🎵", Body: "Xilofon", WordCount: 1},
	{ID: "w-y", Type: "word", Title: "Yoyo", Emoji: "🪀", Body: "Yoyo", WordCount: 1},
	{ID: "w-z", Type: "word", Title: "Zebra", Emoji: "🦓", Body: "Zebra", WordCount: 1},
}

// sentencePassages: kalimat pendek 5-10 kata.
var sentencePassages = []Passage{
	{ID: "s-01", Type: "sentence", Title: "Makan Apel", Emoji: "🍎", Body: "Aku suka makan apel merah.", WordCount: 5},
	{ID: "s-02", Type: "sentence", Title: "Kucing Tidur", Emoji: "🐱", Body: "Kucing itu tidur di atas kursi.", WordCount: 7},
	{ID: "s-03", Type: "sentence", Title: "Main Bola", Emoji: "⚽", Body: "Adi bermain bola di lapangan bersama teman.", WordCount: 7},
	{ID: "s-04", Type: "sentence", Title: "Sekolah Pagi", Emoji: "🏫", Body: "Setiap pagi aku pergi ke sekolah naik sepeda.", WordCount: 9},
	{ID: "s-05", Type: "sentence", Title: "Hujan Turun", Emoji: "🌧️", Body: "Hujan turun deras dan langit menjadi gelap.", WordCount: 7},
	{ID: "s-06", Type: "sentence", Title: "Ibu Memasak", Emoji: "🍳", Body: "Ibu memasak nasi goreng yang harum dan lezat.", WordCount: 8},
	{ID: "s-07", Type: "sentence", Title: "Bintang Malam", Emoji: "⭐", Body: "Malam ini langit cerah dan bintang bersinar indah.", WordCount: 8},
	{ID: "s-08", Type: "sentence", Title: "Ikan di Kolam", Emoji: "🐠", Body: "Ada banyak ikan warna-warni berenang di kolam.", WordCount: 8},
	{ID: "s-09", Type: "sentence", Title: "Bunga Mekar", Emoji: "🌸", Body: "Bunga mawar merah mekar di taman depan rumah.", WordCount: 8},
	{ID: "s-10", Type: "sentence", Title: "Belajar Rajin", Emoji: "✏️", Body: "Belajar dengan rajin setiap hari agar menjadi pintar.", WordCount: 9},
	{ID: "s-11", Type: "sentence", Title: "Gajah Besar", Emoji: "🐘", Body: "Gajah adalah hewan darat terbesar di dunia.", WordCount: 7},
	{ID: "s-12", Type: "sentence", Title: "Minum Susu", Emoji: "🥛", Body: "Minum susu setiap pagi membuat tubuh menjadi sehat.", WordCount: 8},
}

// passages indexed by grade level (1-6), 5 passages each.
var passages = map[int][]Passage{
	1: {
		{ID: "1-1", GradeLevel: 1, Type: "story", Title: "Kucing Saya", Body: "Saya punya kucing. Namanya Mimi. Mimi suka minum susu. Saya sayang Mimi.", WordCount: 13},
		{ID: "1-2", GradeLevel: 1, Type: "story", Title: "Buah Apel", Body: "Apel itu merah. Apel itu manis. Saya suka makan apel. Apel baik untuk tubuh.", WordCount: 13},
		{ID: "1-3", GradeLevel: 1, Type: "story", Title: "Sekolah Saya", Body: "Saya pergi ke sekolah. Saya belajar membaca. Saya belajar menulis. Saya suka sekolah.", WordCount: 14},
		{ID: "1-4", GradeLevel: 1, Type: "story", Title: "Bermain Bola", Body: "Adi suka bermain bola. Ia main bersama teman. Mereka bermain di lapangan. Adi senang sekali.", WordCount: 14},
		{ID: "1-5", GradeLevel: 1, Type: "story", Title: "Ibu Memasak", Body: "Ibu memasak nasi. Ibu juga masak sayur. Masakannya enak sekali. Saya makan dengan lahap.", WordCount: 14},
	},
	2: {
		{ID: "2-1", GradeLevel: 2, Type: "story", Title: "Hari Hujan", Body: "Hari ini hujan turun. Langit menjadi gelap. Saya duduk di rumah. Saya membaca buku cerita. Ibu membuat coklat hangat.", WordCount: 19},
		{ID: "2-2", GradeLevel: 2, Type: "story", Title: "Kebun Bunga", Body: "Di halaman ada kebun bunga. Bunganya bermacam warna. Ada merah, kuning, dan ungu. Lebah terbang mencari madu. Kebun itu indah sekali.", WordCount: 19},
		{ID: "2-3", GradeLevel: 2, Type: "story", Title: "Kelinci Putih", Body: "Pak Tani punya kelinci putih. Kelincinya lucu dan gemuk. Setiap pagi diberi makan wortel. Kelinci itu sangat jinak. Anak-anak suka memegangnya.", WordCount: 19},
		{ID: "2-4", GradeLevel: 2, Type: "story", Title: "Pasar Pagi", Body: "Setiap pagi ibu pergi ke pasar. Ia membeli sayur dan buah. Ada tomat, bayam, dan pisang. Harganya murah dan segar. Ibu senang berbelanja di sana.", WordCount: 22},
		{ID: "2-5", GradeLevel: 2, Type: "story", Title: "Bintang Malam", Body: "Malam ini langit cerah. Bintang-bintang bersinar terang. Saya berdiri di teras rumah. Saya menghitung bintang satu persatu. Langit malam sangat indah.", WordCount: 19},
	},
	3: {
		{ID: "3-1", GradeLevel: 3, Type: "story", Title: "Petualangan Rino", Body: "Rino adalah anak yang pemberani. Ia suka menjelajahi hutan di dekat rumahnya. Suatu hari ia menemukan anak burung yang jatuh. Rino membawanya pulang dan merawatnya. Setelah sembuh, burung itu terbang bebas kembali.", WordCount: 35},
		{ID: "3-2", GradeLevel: 3, Type: "story", Title: "Persahabatan Kura-kura", Body: "Kura-kura dan kelinci adalah sahabat baik. Mereka selalu bermain bersama di padang rumput. Suatu hari kelinci mengejek kura-kura yang berjalan lambat. Kura-kura tidak marah, ia hanya tersenyum. Mereka pun berdamai dan bermain lagi bersama.", WordCount: 36},
		{ID: "3-3", GradeLevel: 3, Type: "story", Title: "Banjir di Desa", Body: "Musim hujan telah tiba. Sungai di desa meluap dan banjir. Warga desa bekerja sama membersihkan saluran air. Anak-anak membantu mengangkat karung pasir. Berkat kerja sama, banjir dapat diatasi dengan cepat.", WordCount: 31},
		{ID: "3-4", GradeLevel: 3, Type: "story", Title: "Si Nelayan Jujur", Body: "Pak Amir adalah nelayan yang jujur. Setiap hari ia pergi ke laut mencari ikan. Suatu hari ia menemukan dompet berisi uang banyak. Ia segera mencari pemiliknya dan mengembalikan dompet itu. Pemilik dompet pun berterima kasih.", WordCount: 36},
		{ID: "3-5", GradeLevel: 3, Type: "story", Title: "Tanaman di Sekolah", Body: "Siswa kelas tiga menanam pohon di sekolah. Mereka membawa bibit dari rumah masing-masing. Bu Guru mengajarkan cara menanam yang benar. Setiap hari mereka menyiram tanaman itu. Sebulan kemudian tanaman tumbuh subur dan hijau.", WordCount: 33},
	},
	4: {
		{ID: "4-1", GradeLevel: 4, Type: "story", Title: "Penemu Muda", Body: "Dani adalah siswa kelas empat yang gemar sains. Ia selalu penasaran dengan hal-hal di sekitarnya. Suatu hari ia mencoba membuat lampu dari kentang. Ternyata kentang mengandung listrik statis yang cukup. Percobaan itu berhasil dan guru Dani sangat bangga. Dani pun semakin bersemangat belajar sains.", WordCount: 45},
		{ID: "4-2", GradeLevel: 4, Type: "story", Title: "Sungai yang Bersih", Body: "Warga kampung Mawar peduli lingkungan sekitar mereka. Setiap minggu mereka bergotong royong membersihkan sungai. Sampah plastik diangkat dan dibuang ke tempat yang benar. Air sungai kini menjadi jernih dan bersih kembali. Ikan-ikan pun kembali bermunculan di sana. Lingkungan yang bersih membuat semua warga bahagia.", WordCount: 43},
		{ID: "4-3", GradeLevel: 4, Type: "story", Title: "Perpustakaan Desa", Body: "Di desa Sukamaju ada perpustakaan kecil yang baru dibuka. Buku-bukunya disumbangkan oleh warga dan donatur. Anak-anak sangat antusias datang setiap sore hari. Mereka membaca buku tentang sains, sejarah, dan cerita rakyat. Pak Lurah berharap perpustakaan ini akan terus berkembang. Membaca buku adalah investasi terbaik untuk masa depan.", WordCount: 45},
		{ID: "4-4", GradeLevel: 4, Type: "story", Title: "Lomba Menggambar", Body: "Sekolah mengadakan lomba menggambar tingkat kecamatan. Maya berlatih setiap malam sebelum lomba dimulai. Ia memilih tema lingkungan hidup untuk karyanya. Dengan sabar ia mewarnai gambar pohon dan sungai. Hari pengumuman tiba dan Maya mendapat juara pertama. Semua kerja keras akhirnya membuahkan hasil yang manis.", WordCount: 43},
		{ID: "4-5", GradeLevel: 4, Type: "story", Title: "Menolong Teman", Body: "Bayu melihat temannya, Riko, sedang menangis di sudut kelas. Ternyata Riko lupa membawa uang jajan dan sangat lapar. Bayu segera berbagi bekalnya tanpa ragu-ragu. Riko sangat berterima kasih atas kebaikan Bayu. Sejak saat itu mereka menjadi sahabat yang akrab. Kebaikan kecil bisa membuat perbedaan besar.", WordCount: 46},
	},
	5: {
		{ID: "5-1", GradeLevel: 5, Type: "story", Title: "Hutan Hujan Tropis", Body: "Indonesia memiliki hutan hujan tropis yang sangat luas. Hutan ini menjadi rumah bagi ribuan jenis tumbuhan dan hewan. Orangutan, harimau, dan gajah Sumatera hidup di sana. Namun, penebangan hutan yang tidak terkontrol mengancam kehidupan mereka. Pemerintah dan masyarakat bersama-sama berupaya menjaga kelestarian hutan. Menanam kembali pohon yang ditebang adalah salah satu solusinya. Kita semua bertanggung jawab menjaga warisan alam ini.", WordCount: 58},
		{ID: "5-2", GradeLevel: 5, Type: "story", Title: "Penjelajah Samudra", Body: "Pelayaran Magellan adalah perjalanan laut paling terkenal dalam sejarah. Ia memimpin ekspedisi mengelilingi bumi pertama kali pada tahun 1519. Kapalnya berlayar melewati Samudra Atlantik dan Pasifik yang luas. Banyak awak kapal yang gugur akibat penyakit dan badai dahsyat. Magellan sendiri meninggal di Filipina sebelum pelayaran usai. Namun ekspedisi itu membuktikan bahwa bumi memang bulat. Penemuan ini mengubah pandangan manusia tentang dunia.", WordCount: 59},
		{ID: "5-3", GradeLevel: 5, Type: "story", Title: "Energi Matahari", Body: "Matahari adalah sumber energi terbesar di tata surya kita. Energi yang dipancarkan matahari sangat besar dan tidak akan habis. Panel surya dapat mengubah sinar matahari menjadi listrik yang berguna. Banyak negara kini beralih menggunakan energi surya untuk kebutuhan sehari-hari. Energi ini ramah lingkungan karena tidak menghasilkan polusi. Indonesia sebagai negara tropis memiliki potensi besar dalam pemanfaatan energi surya. Di masa depan, energi surya akan menjadi sumber utama listrik dunia.", WordCount: 64},
		{ID: "5-4", GradeLevel: 5, Type: "story", Title: "Perjuangan Kartini", Body: "Raden Ajeng Kartini lahir pada tanggal 21 April 1879 di Jepara. Ia dikenal sebagai pahlawan emansipasi wanita Indonesia. Kartini berjuang agar perempuan mendapat hak pendidikan yang sama dengan laki-laki. Lewat surat-suratnya yang terkenal, ia menyuarakan cita-cita kemajuan bangsa. Meski hidupnya tidak panjang, jasanya terasa hingga kini. Setiap tanggal 21 April kita memperingati Hari Kartini. Semangatnya menjadi inspirasi bagi generasi muda Indonesia.", WordCount: 59},
		{ID: "5-5", GradeLevel: 5, Type: "story", Title: "Gempa Bumi", Body: "Gempa bumi adalah getaran yang terjadi di permukaan bumi. Penyebabnya adalah pergerakan lempeng tektonik di dalam bumi. Indonesia terletak di Cincin Api Pasifik sehingga rawan gempa. Gempa besar dapat merusak bangunan dan menyebabkan korban jiwa. Oleh karena itu penting untuk mengetahui cara berlindung saat gempa. Jauhi bangunan tinggi dan berlindung di bawah meja yang kokoh. Kesiapsiagaan adalah kunci keselamatan saat bencana datang.", WordCount: 61},
	},
	6: {
		{ID: "6-1", GradeLevel: 6, Type: "story", Title: "Revolusi Digital", Body: "Perkembangan teknologi digital telah mengubah cara manusia hidup dan bekerja. Internet menghubungkan miliaran orang di seluruh penjuru dunia dalam hitungan detik. Informasi kini dapat diakses dengan mudah melalui gawai di genggaman tangan. Namun, kemudahan ini juga membawa tantangan seperti hoaks dan privasi digital. Kita perlu berpikir kritis sebelum mempercayai dan menyebarkan informasi. Literasi digital menjadi kemampuan penting di abad ke-21 ini. Manfaatkan teknologi dengan bijak untuk masa depan yang lebih baik.", WordCount: 65},
		{ID: "6-2", GradeLevel: 6, Type: "story", Title: "Proklamasi Kemerdekaan", Body: "Pada tanggal 17 Agustus 1945, Indonesia memproklamasikan kemerdekaannya. Ir. Soekarno dan Drs. Mohammad Hatta membacakan teks proklamasi di Jakarta. Peristiwa bersejarah itu merupakan hasil perjuangan panjang seluruh rakyat Indonesia. Para pahlawan rela berkorban jiwa dan raga demi kebebasan bangsa. Kemerdekaan yang diraih bukan hadiah tetapi buah dari pengorbanan luar biasa. Kita sebagai generasi penerus wajib mengisi kemerdekaan dengan prestasi. Hormati jasa pahlawan dengan belajar giat dan berkarya nyata.", WordCount: 65},
		{ID: "6-3", GradeLevel: 6, Type: "story", Title: "Ekosistem Laut", Body: "Laut menutupi lebih dari tujuh puluh persen permukaan bumi. Di dalamnya hidup jutaan spesies makhluk hidup yang beragam. Terumbu karang menjadi ekosistem paling kaya dan paling terancam di lautan. Pemutihan karang akibat pemanasan global mengancam kehidupan ribuan spesies ikan. Aktivitas manusia seperti penangkapan ikan berlebihan juga merusak keseimbangan laut. Program konservasi laut perlu didukung oleh semua pihak tanpa terkecuali. Menjaga laut berarti menjaga sumber kehidupan untuk generasi mendatang.", WordCount: 67},
		{ID: "6-4", GradeLevel: 6, Type: "story", Title: "Kecerdasan Buatan", Body: "Kecerdasan buatan atau Artificial Intelligence semakin berkembang pesat dewasa ini. Mesin kini mampu belajar, mengenali gambar, dan memahami bahasa manusia. AI digunakan dalam berbagai bidang mulai dari kesehatan hingga transportasi. Dokter menggunakan AI untuk mendeteksi penyakit lebih akurat dan cepat. Mobil otonom menggunakan AI untuk berkendara tanpa pengemudi manusia. Namun perkembangan AI juga menimbulkan pertanyaan etis yang serius. Bagaimana memastikan teknologi ini digunakan untuk kebaikan seluruh umat manusia?", WordCount: 66},
		{ID: "6-5", GradeLevel: 6, Type: "story", Title: "Perubahan Iklim", Body: "Perubahan iklim adalah tantangan terbesar yang dihadapi umat manusia saat ini. Suhu rata-rata bumi terus meningkat akibat emisi gas rumah kaca. Pencairan es di kutub menyebabkan permukaan laut naik secara perlahan. Banjir, kekeringan, dan badai ekstrem semakin sering terjadi di berbagai negara. Para ilmuwan mendesak seluruh negara untuk segera mengurangi emisi karbon. Beralih ke energi terbarukan adalah langkah konkret yang harus segera diambil. Masa depan bumi ada di tangan generasi yang peduli lingkungan.", WordCount: 69},
	},
}

// GetPassagesForGrade returns story passages for a given grade level.
func GetPassagesForGrade(gradeLevel int) []Passage {
	if p, ok := passages[gradeLevel]; ok {
		return p
	}
	return passages[1]
}

// GetPassagesByType returns word or sentence passages.
func GetPassagesByType(t string) []Passage {
	switch t {
	case "word":
		return wordPassages
	case "sentence":
		return sentencePassages
	}
	return nil
}

// GetPassageByID finds a passage by its ID string across all types.
func GetPassageByID(id string) (Passage, bool) {
	for _, p := range wordPassages {
		if p.ID == id {
			return p, true
		}
	}
	for _, p := range sentencePassages {
		if p.ID == id {
			return p, true
		}
	}
	for _, list := range passages {
		for _, p := range list {
			if p.ID == id {
				return p, true
			}
		}
	}
	return Passage{}, false
}
