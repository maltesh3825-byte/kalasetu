"""
KalaSetu — Seed products directly into Supabase PostgreSQL
Run: python scripts/seed_products_pg.py
"""
import os, sys, json

# Load env
from pathlib import Path
env_path = Path(__file__).parent.parent / '.env'
if env_path.exists():
    for line in env_path.read_text().splitlines():
        if '=' in line and not line.strip().startswith('#'):
            k, _, v = line.partition('=')
            os.environ.setdefault(k.strip(), v.strip().strip('"'))

DATABASE_URL = os.environ.get('DATABASE_URL', '')
if not DATABASE_URL:
    print("ERROR: DATABASE_URL not found in .env"); sys.exit(1)

try:
    import psycopg2
    import psycopg2.extras
except ImportError:
    print("ERROR: psycopg2 not installed. Run: pip install psycopg2-binary"); sys.exit(1)

PRODUCTS = [
    {
        "name": "Natural Indigo Bhagalpur Tussar Silk Saree",
        "artisan_name": "Manjula Ansari",
        "artisan_phone": "+919876501001",
        "artisan_location": "Bhagalpur, Bihar",
        "category": "Handloom & Textiles",
        "price": 3450, "suggested_price_min": 3000, "suggested_price_max": 4200,
        "description_en": "Pure handloom wild Tussar silk saree hand-dyed with organic indigo using traditional Bhagalpur weaving technique. Features fine natural texture with subtle sheen, 5.5 meters length, 47-inch width, with unstitched blouse piece. GI-tagged Bhagalpur silk.",
        "description_hi": "Shudh hathkargha jangali tsar reshmi sari jo jaivik nil se rangi gayi hai. Bhagalpur bunai taknik se nirmit.",
        "tags": json.dumps(["saree","silk","tussar","indigo","bhagalpur","bihar","handloom","GI-tagged","natural-dye"]),
        "image_url": "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600", "quantity": 8, "rating": 4.8,
    },
    {
        "name": "Kanjivaram Pure Silk Temple Border Saree",
        "artisan_name": "Meenakshi Murugan",
        "artisan_phone": "+919876501002",
        "artisan_location": "Kanchipuram, Tamil Nadu",
        "category": "Handloom & Textiles",
        "price": 7800, "suggested_price_min": 7000, "suggested_price_max": 9000,
        "description_en": "Authentic Kanjivaram pure mulberry silk saree with zari temple border and traditional paisley motifs. Ruby red body with contrast golden-green border. Comes with authenticity certificate. GI-tagged.",
        "description_hi": "Pramaanik Kanjivaram shudh reshmi sari, zari mandir border aur paramparik paisley design ke saath.",
        "tags": json.dumps(["kanjivaram","silk","saree","temple-border","zari","kanchipuram","GI-tagged","bridal"]),
        "image_url": "https://images.unsplash.com/photo-1583391733981-8498408ee4b7?w=600", "quantity": 5, "rating": 4.9,
    },
    {
        "name": "Pochampally Double Ikat Cotton Dress Material",
        "artisan_name": "Laxmi Bai Padmashali",
        "artisan_phone": "+919876501003",
        "artisan_location": "Pochampally, Telangana",
        "category": "Handloom & Textiles",
        "price": 1650, "suggested_price_min": 1400, "suggested_price_max": 2000,
        "description_en": "Double-Ikat resist-dyed cotton dress material from Pochampally. Iconic geometric diamond pattern created by dyeing yarn before weaving. 3-meter length, breathable cotton. GI-tagged Telangana weave.",
        "description_hi": "Pochampally se Double-Ikat cotton dress material. Bunai se pahle dhage ko rangkar banaya gaya.",
        "tags": json.dumps(["ikat","pochampally","cotton","dress-material","GI-tagged","telangana","resist-dye"]),
        "image_url": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600", "quantity": 12, "rating": 4.7,
    },
    {
        "name": "Kachchhi Bandhani Chiffon Dupatta with Mirror Work",
        "artisan_name": "Fatima Khatri",
        "artisan_phone": "+919876501004",
        "artisan_location": "Bhuj, Gujarat",
        "category": "Handloom & Textiles",
        "price": 1900, "suggested_price_min": 1600, "suggested_price_max": 2400,
        "description_en": "Luxurious Kachchhi hand-embroidered dupatta combining Bandhani tie-dye with mirror (abhla) work embroidery. Pure chiffon base with over 2000 individual hand-stitched mirrors. Magenta and gold. 2.25m x 1m.",
        "description_hi": "Bandhani tie-dye aur sheeshe ke kaam ke saath Kachchhi hast-kashidakari dupatta.",
        "tags": json.dumps(["bandhani","dupatta","gujarat","kachchh","mirror-work","embroidery","GI-tagged","chiffon"]),
        "image_url": "https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?w=600", "quantity": 15, "rating": 4.8,
    },
    {
        "name": "Khurja Blue Pottery Ceramic Tea Set (6-piece)",
        "artisan_name": "Saleem Khan",
        "artisan_phone": "+919876501005",
        "artisan_location": "Khurja, Uttar Pradesh",
        "category": "Pottery & Terracotta",
        "price": 1250, "suggested_price_min": 1100, "suggested_price_max": 1600,
        "description_en": "Authentic Khurja blue pottery tea set: 1 teapot and 5 ceramic cups. Hand-painted Persian floral motifs in cobalt blue on white glaze. Lead-free food-safe glaze. GI-tagged Khurja pottery.",
        "description_hi": "Khurja Blue Pottery chai set, 1 chaydani aur 5 cup, haath se chitra phoolon ke saath.",
        "tags": json.dumps(["khurja","blue-pottery","ceramic","tea-set","GI-tagged","UP","food-safe"]),
        "image_url": "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=600", "quantity": 20, "rating": 4.6,
    },
    {
        "name": "Jaipur Blue Pottery Decorative Flower Vase Set",
        "artisan_name": "Gopal Kumawat",
        "artisan_phone": "+919876501006",
        "artisan_location": "Jaipur, Rajasthan",
        "category": "Pottery & Terracotta",
        "price": 890, "suggested_price_min": 750, "suggested_price_max": 1100,
        "description_en": "Set of 2 Jaipur blue pottery vases (30cm and 20cm). Mughal-era Persian technique on quartz-based clay. Cobalt blue and white hand-painted floral motifs with turquoise accents.",
        "description_hi": "Jaipur Blue Pottery phooldan ka joda, Mughalkalin Farsi taknik se banaya gaya.",
        "tags": json.dumps(["jaipur","blue-pottery","vase","rajasthan","decor","persian-technique"]),
        "image_url": "https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=600", "quantity": 18, "rating": 4.5,
    },
    {
        "name": "Warli Tribal Folk Art Terracotta Pot",
        "artisan_name": "Sukri Bhura",
        "artisan_phone": "+919876501007",
        "artisan_location": "Dahanu, Maharashtra",
        "category": "Pottery & Terracotta",
        "price": 580, "suggested_price_min": 450, "suggested_price_max": 720,
        "description_en": "Handcrafted terracotta pot with Warli tribal folk art. White pigment Warli murals depicting village life, dance, and harvest festival on natural terracotta base.",
        "description_hi": "Paramparagat Warli adivasi kala se sushobhit hastnirmit terracotta bartan.",
        "tags": json.dumps(["warli","terracotta","tribal-art","maharashtra","folk-art","decor"]),
        "image_url": "https://images.unsplash.com/photo-1622396481328-9b1b78cdd9fd?w=600", "quantity": 25, "rating": 4.7,
    },
    {
        "name": "Bastar Dhokra Lost-Wax Cast Tribal Musician Figurine",
        "artisan_name": "Suresh Baghel",
        "artisan_phone": "+919876501008",
        "artisan_location": "Kondagaon, Chhattisgarh",
        "category": "Brass & Metalcraft",
        "price": 2800, "suggested_price_min": 2400, "suggested_price_max": 3500,
        "description_en": "Authentic Bastar Dhokra figurine of a tribal musician playing traditional flute. Made using the 4000-year-old lost-wax (cire perdue) casting technique with non-ferrous brass alloy. Each piece is unique. Height 22cm. GI-tagged.",
        "description_hi": "Bastar Dhokra, 4000 saal purani khoya-mom taknik se bana janjatiya sangeetkaar ka putla.",
        "tags": json.dumps(["dhokra","bastar","lost-wax","brass","tribal","chhattisgarh","figurine","GI-tagged"]),
        "image_url": "https://images.unsplash.com/photo-1606293926075-69a00dbfde81?w=600", "quantity": 10, "rating": 4.9,
    },
    {
        "name": "Moradabad Brass Engraved Peacock Decorative Plate",
        "artisan_name": "Hussain Mirza",
        "artisan_phone": "+919876501009",
        "artisan_location": "Moradabad, Uttar Pradesh",
        "category": "Brass & Metalcraft",
        "price": 1380, "suggested_price_min": 1100, "suggested_price_max": 1700,
        "description_en": "Moradabad-style brass decorative plate with hand-engraved dancing peacock. 30cm diameter, gold-toned brass with antique patina. Wall-mountable with back hooks. GI-recognized brassware.",
        "description_hi": "Moradabad peetal ki sajawati plate jis par haath se nakkashidar mor bana hai.",
        "tags": json.dumps(["moradabad","brass","engraved","peacock","plate","GI-tagged","UP","decor"]),
        "image_url": "https://images.unsplash.com/photo-1601662528567-526cd06f6582?w=600", "quantity": 14, "rating": 4.6,
    },
    {
        "name": "Channapatna Lacquerware Wooden Elephant Set (3 sizes)",
        "artisan_name": "Rajappa Gowda",
        "artisan_phone": "+919876501010",
        "artisan_location": "Channapatna, Karnataka",
        "category": "Woodcraft",
        "price": 680, "suggested_price_min": 550, "suggested_price_max": 850,
        "description_en": "Set of 3 Channapatna lacquerware elephants (Large 18cm, Medium 12cm, Small 8cm). Hale wood with natural lac color. Non-toxic and child-safe. GI-tagged Karnataka craft.",
        "description_hi": "Channapatna laakhkari teen hathiyon ka set, haale lakdi aur prakratik rang se bana.",
        "tags": json.dumps(["channapatna","lacquerware","wooden","elephant","karnataka","GI-tagged","non-toxic"]),
        "image_url": "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=600", "quantity": 30, "rating": 4.8,
    },
    {
        "name": "Saharanpur Sheesham Wood Carved Jali Decorative Panel",
        "artisan_name": "Rafiq Ahmed",
        "artisan_phone": "+919876501011",
        "artisan_location": "Saharanpur, Uttar Pradesh",
        "category": "Woodcraft",
        "price": 3200, "suggested_price_min": 2800, "suggested_price_max": 4000,
        "description_en": "Wall panel carved from solid Sheesham (Indian Rosewood) with intricate floral jali lattice. 60cm x 90cm. Traditional Saharanpur Mughal geometric star patterns. Use as wall art or room divider.",
        "description_hi": "Saharanpur hastashilp mein sheesham ki lakdi se banaya gaya jali panel.",
        "tags": json.dumps(["saharanpur","sheesham","jali","wood-carving","rosewood","UP","wall-panel"]),
        "image_url": "https://images.unsplash.com/photo-1567225591450-06036b3392a6?w=600", "quantity": 7, "rating": 4.7,
    },
    {
        "name": "Bastar Filigree Oxidized Silver Tribal Necklace",
        "artisan_name": "Kamla Nag",
        "artisan_phone": "+919876501012",
        "artisan_location": "Jagdalpur, Chhattisgarh",
        "category": "Tribal Jewelry",
        "price": 950, "suggested_price_min": 800, "suggested_price_max": 1200,
        "description_en": "Bastar-style oxidized silver alloy tribal necklace with peacock and lotus pendants. Filigree technique where fine metal threads form intricate patterns. Adjustable 45-55cm. Nickel-free.",
        "description_hi": "Bastar shaili ki oxidized silver janjatiya haar, taar filigree taknik se bani.",
        "tags": json.dumps(["tribal","jewelry","necklace","bastar","chhattisgarh","filigree","oxidized-silver"]),
        "image_url": "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=600", "quantity": 20, "rating": 4.6,
    },
    {
        "name": "Jaipur Kundan Meenakari Gold-Plated Chandelier Earrings",
        "artisan_name": "Devdas Soni",
        "artisan_phone": "+919876501013",
        "artisan_location": "Jaipur, Rajasthan",
        "category": "Tribal Jewelry",
        "price": 1600, "suggested_price_min": 1400, "suggested_price_max": 2000,
        "description_en": "Traditional Rajasthani Kundan-Meenakari chandelier earrings. 22-karat gold-plated brass with polki-style glass stones and hand-painted enamel reverse. 500-year-old royal Jaipur art form. 7cm drop.",
        "description_hi": "Jaipur Kundan-Meenakari jhumka, 22 karat sona chadhi hui peetal par hast chitra meena.",
        "tags": json.dumps(["kundan","meenakari","jaipur","rajasthan","earrings","gold-plated","royal-craft","GI-tagged"]),
        "image_url": "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600", "quantity": 25, "rating": 4.8,
    },
    {
        "name": "Madhubani Mithila Painting — Shiva Family Scene",
        "artisan_name": "Dulari Devi",
        "artisan_phone": "+919876501014",
        "artisan_location": "Madhubani, Bihar",
        "category": "Folk Art & Painting",
        "price": 2400, "suggested_price_min": 2000, "suggested_price_max": 3200,
        "description_en": "Original Madhubani Mithila painting on handmade cotton rag paper depicting Shiva with Parvati, Ganesha, and Nandi in Godna style. By National Award artisan Dulari Devi. Natural earth pigments. 45x60cm.",
        "description_hi": "Madhubani Mithila chitrakari, Rashtriya Puraskar vijeta Dulari Devi dwara hastnirmit kagaz par.",
        "tags": json.dumps(["madhubani","mithila-painting","folk-art","bihar","GI-tagged","natural-pigment","national-award"]),
        "image_url": "https://images.unsplash.com/photo-1569091791842-7cfb64e04797?w=600", "quantity": 6, "rating": 5.0,
    },
    {
        "name": "Odisha Pattachitra Scroll Painting — Lord Jagannath",
        "artisan_name": "Apindra Moharana",
        "artisan_phone": "+919876501015",
        "artisan_location": "Raghurajpur, Odisha",
        "category": "Folk Art & Painting",
        "price": 3100, "suggested_price_min": 2600, "suggested_price_max": 4000,
        "description_en": "Authentic Pattachitra scroll from UNESCO-listed Raghurajpur village. Depicts Lord Jagannath, Balabhadra, and Subhadra with temple chariot motifs. Natural canvas with 12 mineral pigments and tamarind glue.",
        "description_hi": "Odisha Pattachitra scroll, Raghurajpur UNESCO virasat gaon se, Jagannath Mahaprabhu chitran.",
        "tags": json.dumps(["pattachitra","odisha","GI-tagged","scroll-painting","jagannath","UNESCO","mineral-pigment"]),
        "image_url": "https://images.unsplash.com/photo-1549490349-8643362247b5?w=600", "quantity": 8, "rating": 4.9,
    },
    {
        "name": "Gond Tribal Art Painting — Tree of Life (Canvas)",
        "artisan_name": "Nankusia Shyam",
        "artisan_phone": "+919876501016",
        "artisan_location": "Patangarh, Madhya Pradesh",
        "category": "Folk Art & Painting",
        "price": 1800, "suggested_price_min": 1500, "suggested_price_max": 2400,
        "description_en": "Original Gond tribal painting on canvas — Tree of Life with birds and deity forms in intricate dot-dash patterns. By Nankusia Shyam from the famous Shyam family. Acrylic on canvas, 40x50cm, framed.",
        "description_hi": "Gond janjatiya chitrakari, Jeevan Vriksh ke saath pakshiyon aur praniyon ka bindu-rekha chitran.",
        "tags": json.dumps(["gond","tribal-painting","madhya-pradesh","tree-of-life","dot-pattern","canvas"]),
        "image_url": "https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=600", "quantity": 10, "rating": 4.7,
    },
    {
        "name": "Assamese Bamboo Hand-Woven Wall Clock (Majuli Style)",
        "artisan_name": "Bijay Doley",
        "artisan_phone": "+919876501017",
        "artisan_location": "Majuli, Assam",
        "category": "Cane & Bamboo",
        "price": 750, "suggested_price_min": 600, "suggested_price_max": 950,
        "description_en": "Decorative wall clock with face hand-woven in Assamese Majuli style using traditional tribal hexagonal weave pattern. Silent quartz AA-battery mechanism included. 30cm diameter. Muli bamboo split frame.",
        "description_hi": "Asami Majuli shaili mein buna gaya baas ka deewar ghadi, shaant quartz yantra sahit.",
        "tags": json.dumps(["bamboo","assam","majuli","wall-clock","handwoven","cane","tribal-weave"]),
        "image_url": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600", "quantity": 22, "rating": 4.5,
    },
    {
        "name": "Tripura Rattan Reed Oval Fruit Basket with Lid",
        "artisan_name": "Brishali Deb",
        "artisan_phone": "+919876501018",
        "artisan_location": "Agartala, Tripura",
        "category": "Cane & Bamboo",
        "price": 620, "suggested_price_min": 500, "suggested_price_max": 800,
        "description_en": "Oval wicker basket from locally harvested Tripura rattan reed with hinged lid and braided natural handle. Multi-purpose: fruit storage, bread basket, picnic hamper. 35x25x20cm.",
        "description_hi": "Tripura ratan bet se buni hui andakar tokari, dhakkan aur prakratik handle ke saath.",
        "tags": json.dumps(["rattan","basket","tripura","cane","handwoven","eco-friendly","storage"]),
        "image_url": "https://images.unsplash.com/photo-1595348020949-87cdfbb44174?w=600", "quantity": 28, "rating": 4.4,
    },
    {
        "name": "Kolhapuri Hand-Stitched Vegetable-Tanned Leather Chappal",
        "artisan_name": "Ganesh Kambli",
        "artisan_phone": "+919876501019",
        "artisan_location": "Kolhapur, Maharashtra",
        "category": "Leather Craft",
        "price": 880, "suggested_price_min": 750, "suggested_price_max": 1100,
        "description_en": "Authentic Kolhapuri chappal from vegetable-tanned cow hide leather with hand-punched floral medallion strap design. GI-tagged, exported to 40+ countries. Flat sole, hand-stitched edge. Men sizes 6-12.",
        "description_hi": "Kolhapuri chappal, vanaspati-ranjit bachhde ki khaal se haath se bani, GI-manyata prapt.",
        "tags": json.dumps(["kolhapuri","chappal","leather","maharashtra","GI-tagged","vegetable-tanned","sandal"]),
        "image_url": "https://images.unsplash.com/photo-1603808033192-082d6919d3e1?w=600", "quantity": 40, "rating": 4.7,
    },
    {
        "name": "Kondapalli Kinnal Wooden Dancing Ganesha Toy",
        "artisan_name": "P. Venkateswara Rao",
        "artisan_phone": "+919876501020",
        "artisan_location": "Kondapalli, Andhra Pradesh",
        "category": "Woodcraft",
        "price": 560, "suggested_price_min": 450, "suggested_price_max": 700,
        "description_en": "Traditional Kondapalli Kinnal wooden toy of Dancing Ganesha in tella poniki (white sago) wood. Natural organic pigments in vivid festival colors. Used in temple processions and home decor. Height 18cm. GI-tagged.",
        "description_hi": "Kondapalli Kinnal shilp mein naachte Ganesha ka lakdi ka khilona, prakratik rangon se chitra.",
        "tags": json.dumps(["kondapalli","wooden-toy","ganesha","andhra-pradesh","GI-tagged","folk-toy","natural-pigment"]),
        "image_url": "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=600", "quantity": 35, "rating": 4.8,
    },
    {
        "name": "Mahabalipuram Granite Nataraja Dancing Shiva Sculpture",
        "artisan_name": "R. Dhandapani",
        "artisan_phone": "+919876501021",
        "artisan_location": "Mahabalipuram, Tamil Nadu",
        "category": "Stone Carving",
        "price": 4500, "suggested_price_min": 4000, "suggested_price_max": 5500,
        "description_en": "Exquisitely hand-carved Nataraja (Cosmic Dancer) in black Krishnagiri granite. Shiva performing Ananda Tandava in ring of fire (prabhamandala). Height 35cm. 7th-century Pallava tradition.",
        "description_hi": "Mahabalipuram Krishnagiri granite mein haath se taraashi gayi Nataraaja pratima, 7vi sadi Pallava parampara.",
        "tags": json.dumps(["nataraja","granite","stone-carving","mahabalipuram","tamil-nadu","GI-tagged","shiva","pallava"]),
        "image_url": "https://images.unsplash.com/photo-1599458252573-56ae36120de1?w=600", "quantity": 4, "rating": 4.9,
    },
]

def seed():
    conn = psycopg2.connect(DATABASE_URL)
    conn.autocommit = False
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    inserted = 0
    skipped = 0
    for p in PRODUCTS:
        cur.execute("SELECT id FROM products WHERE name = %s LIMIT 1", (p["name"],))
        if cur.fetchone():
            print(f"  SKIP: {p['name'][:55]}")
            skipped += 1
            continue

        cur.execute("""
            INSERT INTO products (
                name, artisan_name, artisan_phone, artisan_location,
                category, price, suggested_price_min, suggested_price_max,
                description_en, description_hi, tags, image_url,
                quantity, rating, is_enhanced, mosje_verified
            ) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,1,1)
        """, (
            p["name"], p["artisan_name"], p.get("artisan_phone", "+919876543210"),
            p["artisan_location"], p["category"], p["price"],
            p.get("suggested_price_min", p["price"]), p.get("suggested_price_max", p["price"]),
            p["description_en"], p.get("description_hi", ""), p["tags"], p["image_url"],
            p.get("quantity", 5), p.get("rating", 4.5)
        ))
        print(f"  ADDED: {p['name'][:55]}")
        inserted += 1

    conn.commit()
    cur.close()
    conn.close()
    print(f"\nDone! Inserted {inserted} products, skipped {skipped} duplicates.")

if __name__ == "__main__":
    seed()
