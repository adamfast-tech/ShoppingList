// ══════════════════════════════════════════════════════
//  CATALOGUE PRODUITS — 8 rayons, découpés en sous-rayons
//  Rayon (enregistré avec l'article) → sous-rayon (affichage) → produits
// ══════════════════════════════════════════════════════
const PRODUCT_CATALOG = {
  "Fruits & Légumes": [
    { sub: "Fruits du quotidien", emoji: "🍎", items: [
      "Pomme Golden","Pomme Granny Smith","Pomme Gala","Pomme Pink Lady","Poire","Banane","Kiwi",
      "Raisin blanc","Raisin noir","Prune","Kaki","Coing","Rhubarbe"] },
    { sub: "Agrumes", emoji: "🍊", items: [
      "Orange","Clémentine","Mandarine","Pamplemousse","Citron","Citron vert"] },
    { sub: "Fruits rouges & d'été", emoji: "🍓", items: [
      "Fraise","Framboise","Myrtille","Mûre","Cerise","Pêche","Nectarine","Abricot","Melon",
      "Pastèque","Figue"] },
    { sub: "Fruits exotiques", emoji: "🥭", items: [
      "Ananas","Mangue","Avocat","Grenade","Litchi","Fruit de la passion","Noix de coco","Datte","Pruneau"] },
    { sub: "Salades & crudités", emoji: "🥗", items: [
      "Tomate","Tomate cerise","Concombre","Salade verte","Laitue","Roquette","Mâche","Épinard",
      "Pousse d'épinard","Endive","Frisée","Cresson","Radis","Pousse de soja","Germe de blé"] },
    { sub: "Légumes verts & choux", emoji: "🥦", items: [
      "Brocoli","Chou-fleur","Chou blanc","Chou rouge","Chou de Bruxelles","Chou kale","Haricot vert",
      "Haricot blanc","Petit pois","Fève","Poireau","Céleri branche","Fenouil","Artichaut","Asperge"] },
    { sub: "Légumes du soleil & courges", emoji: "🍆", items: [
      "Courgette","Aubergine","Poivron rouge","Poivron vert","Poivron jaune","Maïs","Cornichon",
      "Tomate séchée","Potiron","Butternut","Citrouille"] },
    { sub: "Pommes de terre & racines", emoji: "🥔", items: [
      "Pomme de terre","Patate douce","Carotte","Betterave","Navet","Panais","Céleri rave",
      "Topinambour","Salsifis","Igname","Manioc"] },
    { sub: "Oignons, ail & piments", emoji: "🧅", items: [
      "Oignon","Oignon rouge","Échalote","Ail","Gingembre frais","Piment","Piment d'Espelette"] },
    { sub: "Champignons", emoji: "🍄", items: [
      "Champignon de Paris","Champignon shiitake","Pleurote","Cèpe","Girolle"] },
    { sub: "Herbes fraîches", emoji: "🌿", items: [
      "Persil","Basilic","Coriandre","Ciboulette","Menthe","Thym","Romarin","Aneth","Estragon",
      "Sauge","Laurier"] },
  ],

  "Viandes & Poissons": [
    { sub: "Volaille & lapin", emoji: "🐔", items: [
      "Poulet entier","Blanc de poulet","Cuisse de poulet","Pilon de poulet","Aile de poulet",
      "Escalope de poulet","Filet de dinde","Cuisse de dinde","Cuisse de canard","Magret de canard",
      "Confit de canard","Lapin"] },
    { sub: "Bœuf & veau", emoji: "🥩", items: [
      "Steak haché 5%","Steak haché 15%","Steak de boeuf","Entrecôte","Faux-filet","Rumsteck","Bavette",
      "Onglet","Paleron","Pot-au-feu","Rôti de boeuf","Bourguignon","Côte de boeuf","Tartare de boeuf",
      "Veau escalope","Blanquette de veau","Côte de veau","Tête de veau","Foie de veau","Steak de cheval"] },
    { sub: "Porc & agneau", emoji: "🐖", items: [
      "Côte de porc","Filet mignon de porc","Rôti de porc","Échine de porc","Travers de porc",
      "Gigot d'agneau","Côtelette d'agneau","Épaule d'agneau","Souris d'agneau"] },
    { sub: "Saucisses & grillades", emoji: "🌭", items: [
      "Saucisse de Toulouse","Chipolata","Merguez","Saucisse de Strasbourg","Andouillette",
      "Boudin noir","Boudin blanc"] },
    { sub: "Charcuterie", emoji: "🥓", items: [
      "Jambon blanc","Jambon cru","Jambon serrano","Lardons","Bacon","Saucisson sec","Chorizo",
      "Pâté","Rillettes","Terrine","Foie gras"] },
    { sub: "Poissons", emoji: "🐟", items: [
      "Saumon frais","Cabillaud","Lieu noir","Colin","Merlu","Truite","Sole","Dorade","Bar",
      "Thon frais","Maquereau","Sardine","Raie","Lotte","Rouget","Turbot","Flétan"] },
    { sub: "Fruits de mer", emoji: "🦐", items: [
      "Crevette","Crevette rose","Gambas","Langoustine","Homard","Crabe","Moule","Huître",
      "Coquille Saint-Jacques","Calamar","Poulpe","Seiche"] },
    { sub: "Fumés & traiteur de la mer", emoji: "🍣", items: [
      "Saumon fumé","Truite fumée","Hareng","Anchois","Surimi","Tarama","Brandade"] },
  ],

  "Produits laitiers": [
    { sub: "Laits", emoji: "🥛", items: [
      "Lait demi-écrémé","Lait entier","Lait écrémé","Lait sans lactose","Lait concentré","Lait en poudre"] },
    { sub: "Boissons végétales", emoji: "🌱", items: [
      "Lait d'amande","Lait de soja","Lait d'avoine","Lait de coco"] },
    { sub: "Beurre & crème", emoji: "🧈", items: [
      "Beurre doux","Beurre demi-sel","Beurre allégé","Margarine","Crème fraîche épaisse",
      "Crème fraîche liquide","Crème entière","Crème allégée","Crème fouettée","Mascarpone"] },
    { sub: "Œufs", emoji: "🥚", items: [
      "Oeufs","Oeufs bio","Oeufs de caille"] },
    { sub: "Yaourts & fromages blancs", emoji: "🥄", items: [
      "Yaourt nature","Yaourt aux fruits","Yaourt grec","Yaourt à boire","Yaourt soja","Skyr",
      "Fromage blanc","Petit-suisse","Faisselle"] },
    { sub: "Desserts lactés", emoji: "🍮", items: [
      "Crème dessert","Crème anglaise","Flan","Crème caramel","Riz au lait","Mousse au chocolat"] },
    { sub: "Fromages français", emoji: "🧀", items: [
      "Camembert","Brie","Comté","Emmental","Gruyère","Cantal","Tomme","Saint-Nectaire","Reblochon",
      "Mont d'Or","Munster","Roquefort","Bleu d'Auvergne","Raclette","Fondue"] },
    { sub: "Chèvre & fromages frais", emoji: "🐐", items: [
      "Chèvre frais","Chèvre sec","Bûche de chèvre","Fromage à tartiner",
      "Fromage frais ail et fines herbes","Babybel","Vache qui rit"] },
    { sub: "Fromages italiens & cuisine", emoji: "🍕", items: [
      "Mozzarella","Burrata","Ricotta","Parmesan","Pecorino","Gorgonzola","Feta","Cheddar","Fromage râpé"] },
  ],

  "Épicerie": [
    { sub: "Pâtes, riz & céréales", emoji: "🍝", items: [
      "Pâtes spaghetti","Pâtes penne","Pâtes coquillettes","Pâtes tagliatelles","Pâtes lasagne",
      "Pâtes fusilli","Riz basmati","Riz rond","Riz complet","Riz thaï","Riz à risotto","Semoule",
      "Couscous","Quinoa","Boulgour","Polenta","Vermicelles de riz"] },
    { sub: "Conserves & légumineuses", emoji: "🥫", items: [
      "Tomates pelées","Coulis de tomate","Concentré de tomate","Maïs en boîte","Petits pois en boîte",
      "Haricots rouges","Pois chiches","Lentilles vertes","Lentilles corail","Flageolets",
      "Thon en boîte","Thon au naturel","Sardines à l'huile","Soupe en brique","Velouté",
      "Olives vertes","Olives noires","Câpres","Cornichons au vinaigre"] },
    { sub: "Huiles, vinaigres & condiments", emoji: "🫒", items: [
      "Huile d'olive","Huile de tournesol","Huile de colza","Huile de sésame","Huile de coco",
      "Vinaigre balsamique","Vinaigre de vin","Vinaigre de cidre","Moutarde","Mayonnaise","Ketchup",
      "Vinaigrette"] },
    { sub: "Sauces & cuisine du monde", emoji: "🥢", items: [
      "Sauce tomate","Pesto","Sauce soja","Sauce barbecue","Sauce worcestershire","Tabasco",
      "Lait de coco (cuisine)","Pâte de curry","Sauce nuoc-mam","Sauce hoisin","Vinaigre de riz",
      "Sushi (kit)","Nori","Tartare d'algues"] },
    { sub: "Sel, épices & bouillons", emoji: "🧂", items: [
      "Sel fin","Sel de Guérande","Poivre noir","Poivre blanc","Paprika","Curry","Cumin","Curcuma",
      "Cannelle","Muscade","Herbes de Provence","Origan","Piment de Cayenne","Bouillon de légumes",
      "Bouillon de poule","Bouillon de boeuf","Fond de veau"] },
    { sub: "Farine, sucre & pâtisserie", emoji: "🧁", items: [
      "Farine de blé","Farine complète","Farine de sarrasin","Fécule de maïs","Levure boulangère",
      "Levure chimique","Sucre blanc","Sucre roux","Sucre vanillé","Sucre glace","Chocolat noir",
      "Chocolat au lait","Chocolat blanc","Cacao en poudre","Pépites de chocolat","Pâte feuilletée",
      "Pâte brisée","Pâte sablée","Gelée dessert"] },
    { sub: "Petit-déjeuner", emoji: "🍯", items: [
      "Céréales corn flakes","Muesli","Granola","Porridge flocons d'avoine","Biscottes","Miel",
      "Confiture fraise","Confiture abricot","Confiture framboise","Pâte à tartiner","Nutella",
      "Beurre de cacahuète","Sirop d'érable","Sirop d'agave"] },
    { sub: "Biscuits & gâteaux", emoji: "🍪", items: [
      "Biscuits sablés","Biscuits chocolat","Madeleines","Spéculoos","Gâteau au chocolat",
      "Cake aux fruits","Crêpes"] },
    { sub: "Pains & viennoiseries", emoji: "🥖", items: [
      "Baguette","Pain de mie","Pain complet","Pain burger","Pain pita","Tortillas","Wraps",
      "Croissant","Pain au chocolat","Brioche","Chapelure"] },
    { sub: "Apéritif & fruits secs", emoji: "🥜", items: [
      "Chips","Crackers","Popcorn","Cacahuètes","Amandes","Noix","Noisettes","Pistaches",
      "Noix de cajou","Raisins secs","Fruits secs mélangés","Graines de tournesol","Graines de chia",
      "Graines de lin","Galettes de riz","Houmous","Tapenade","Guacamole"] },
    { sub: "Végétarien", emoji: "🌱", items: [
      "Tofu","Tofu fumé","Tempeh","Seitan","Steak végétal","Falafels","Galette de légumes",
      "Levure nutritionnelle"] },
  ],

  "Boissons": [
    { sub: "Eaux", emoji: "💧", items: [
      "Eau plate","Eau gazeuse","Eau aromatisée"] },
    { sub: "Jus & smoothies", emoji: "🧃", items: [
      "Jus d'orange","Jus de pomme","Jus de raisin","Jus multifruits","Jus de tomate","Jus de citron",
      "Smoothie"] },
    { sub: "Sodas & sirops", emoji: "🥤", items: [
      "Soda cola","Limonade","Soda agrumes","Tonic","Thé glacé","Boisson énergisante",
      "Sirop de fruits","Sirop grenadine","Sirop menthe"] },
    { sub: "Café, thé & chocolat", emoji: "☕", items: [
      "Café moulu","Café en grains","Café soluble","Capsules de café","Thé noir","Thé vert","Tisane",
      "Chocolat chaud en poudre","Lait chocolaté"] },
    { sub: "Vins & bulles", emoji: "🍷", items: [
      "Vin rouge","Vin blanc","Vin rosé","Champagne","Crémant","Cidre"] },
    { sub: "Bières", emoji: "🍺", items: [
      "Bière blonde","Bière brune","Bière blanche","Bière IPA","Bière sans alcool"] },
    { sub: "Spiritueux & apéritifs", emoji: "🥃", items: [
      "Whisky","Vodka","Rhum","Gin","Pastis","Apéritif anisé","Porto","Liqueur"] },
  ],

  "Surgelés": [
    { sub: "Légumes surgelés", emoji: "🥦", items: [
      "Légumes mélangés surgelés","Petits pois surgelés","Haricots verts surgelés","Épinards surgelés",
      "Brocolis surgelés","Wok de légumes surgelé","Soupe surgelée"] },
    { sub: "Frites & pommes de terre", emoji: "🍟", items: [
      "Frites surgelées","Pommes noisettes","Galettes de pommes de terre"] },
    { sub: "Plats & snacking", emoji: "🍕", items: [
      "Pizza surgelée","Lasagnes surgelées","Quiche surgelée","Riz cantonais surgelé","Nuggets de poulet",
      "Cordon bleu","Quenelles","Beignets de crevettes","Crêpes surgelées"] },
    { sub: "Poissons & fruits de mer", emoji: "🐟", items: [
      "Filet de poisson pané","Fruits de mer surgelés","Crevettes surgelées"] },
    { sub: "Glaces & desserts", emoji: "🍦", items: [
      "Glace vanille","Glace chocolat","Sorbet fruits","Bâtonnets glacés","Tarte aux pommes surgelée"] },
    { sub: "Fruits, pains & pâtes", emoji: "🥐", items: [
      "Fruits rouges surgelés","Mangue surgelée","Pain surgelé","Viennoiserie surgelée",
      "Pâte feuilletée surgelée"] },
  ],

  "Hygiène": [
    { sub: "Douche, cheveux & rasage", emoji: "🚿", items: [
      "Gel douche","Savon","Shampoing","Après-shampoing","Déodorant","Mousse à raser","Rasoir"] },
    { sub: "Dents", emoji: "🦷", items: [
      "Dentifrice","Brosse à dents","Fil dentaire","Bain de bouche"] },
    { sub: "Soins & beauté", emoji: "🧴", items: [
      "Crème hydratante","Lait corporel","Crème solaire","Démaquillant","Coton démaquillant",
      "Sérum visage","Masque visage","Baume à lèvres","Parfum","Eau de toilette","Vernis à ongles"] },
    { sub: "Papier & coton", emoji: "🧻", items: [
      "Papier toilette","Mouchoirs","Coton-tige","Coton hydrophile"] },
    { sub: "Bébé", emoji: "👶", items: [
      "Couches","Lingettes bébé","Lait de toilette bébé"] },
    { sub: "Santé & intime", emoji: "🩹", items: [
      "Médicaments courants","Pansements","Désinfectant","Gel hydroalcoolique",
      "Protections périodiques","Tampons","Préservatifs"] },
  ],

  "Autre": [
    { sub: "Ménage & lessive", emoji: "🧽", items: [
      "Lessive","Adoucissant","Liquide vaisselle","Tablettes lave-vaisselle","Éponge",
      "Nettoyant multi-usage","Nettoyant vitres","Javel","Désodorisant intérieur","Sac poubelle",
      "Papier essuie-tout"] },
    { sub: "Cuisine & conservation", emoji: "🍱", items: [
      "Papier aluminium","Film plastique","Papier sulfurisé","Sac congélation","Bocal de conservation",
      "Ficelle cuisine","Filtre à café papier"] },
    { sub: "Animaux", emoji: "🐾", items: [
      "Croquettes chat","Pâtée chat","Litière chat","Croquettes chien","Pâtée chien","Friandises animaux"] },
    { sub: "Maison & jardin", emoji: "🏠", items: [
      "Pile AA","Pile AAA","Ampoule LED","Bougie","Allumettes","Sac cabas","Plante d'intérieur","Terreau"] },
  ],
};

// Liste à plat pour la recherche et l'autocomplétion : [{ name, category, sub, subEmoji }]
const PRODUCT_FLAT = Object.entries(PRODUCT_CATALOG).flatMap(([category, subs]) =>
  subs.flatMap(s => s.items.map(name => ({ name, category, sub: s.sub, subEmoji: s.emoji })))
);
