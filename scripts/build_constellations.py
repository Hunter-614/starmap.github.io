"""
Builds standard IAU constellation definitions and stick-figure lines.
Coordinates in Right Ascension (degrees 0-360) and Declination (degrees -90 to +90).
"""

import json
import os

CONSTELLATIONS = [
    {
        "id": "Ori",
        "name": "Orion",
        "meaning": "The Hunter",
        "ra": 84.0, "dec": 0.0,
        "lines": [
            # Betelgeuse to Bellatrix (shoulders)
            [[88.79, 7.41], [81.28, 6.35]],
            # Bellatrix to Rigel
            [[81.28, 6.35], [78.63, -8.20]],
            # Betelgeuse to Saiph
            [[88.79, 7.41], [86.94, -9.67]],
            # Saiph to Rigel (feet)
            [[86.94, -9.67], [78.63, -8.20]],
            # Belt: Alnitak -> Alnilam -> Mintaka
            [[85.19, -1.94], [84.05, -1.20]],
            [[84.05, -1.20], [83.00, -0.30]],
            # Belt to shoulders & feet
            [[84.05, -1.20], [88.79, 7.41]],
            [[84.05, -1.20], [78.63, -8.20]],
            # Head: Meissa to shoulders
            [[88.79, 7.41], [83.78, 9.93]],
            [[81.28, 6.35], [83.78, 9.93]]
        ]
    },
    {
        "id": "UMa",
        "name": "Ursa Major",
        "meaning": "The Great Bear (Big Dipper)",
        "ra": 170.0, "dec": 55.0,
        "lines": [
            # Bowl: Dubhe -> Merak -> Phecda -> Megrez -> Dubhe
            [[165.93, 61.75], [165.46, 56.38]],
            [[165.46, 56.38], [178.46, 53.70]],
            [[178.46, 53.70], [183.86, 57.03]],
            [[183.86, 57.03], [165.93, 61.75]],
            # Handle: Megrez -> Alioth -> Mizar -> Alkaid
            [[183.86, 57.03], [193.51, 55.96]],
            [[193.51, 55.96], [200.98, 54.93]],
            [[200.98, 54.93], [206.88, 49.31]],
            # Bear legs / body extensions
            [[165.46, 56.38], [137.58, 60.72]],
            [[178.46, 53.70], [175.11, 44.50]],
            [[175.11, 44.50], [169.55, 33.09]]
        ]
    },
    {
        "id": "UMi",
        "name": "Ursa Minor",
        "meaning": "The Little Bear (Little Dipper)",
        "ra": 230.0, "dec": 78.0,
        "lines": [
            # Polaris to Yildun to Urodelus
            [[37.95, 89.26], [262.70, 86.59]],
            [[262.70, 86.59], [236.43, 77.79]],
            # Bowl: Zeta -> Kochab -> Pherkad -> Eta -> Zeta
            [[236.43, 77.79], [222.68, 74.16]],
            [[222.68, 74.16], [230.18, 71.83]],
            [[230.18, 71.83], [244.60, 75.76]],
            [[244.60, 75.76], [236.43, 77.79]]
        ]
    },
    {
        "id": "Cas",
        "name": "Cassiopeia",
        "meaning": "The Queen ('W' shape)",
        "ra": 15.0, "dec": 60.0,
        "lines": [
            # Caph -> Schedar -> Navi -> Ruchbah -> Segin
            [[2.30, 59.15], [10.13, 56.54]],
            [[10.13, 56.54], [14.18, 60.72]],
            [[14.18, 60.72], [19.60, 60.24]],
            [[19.60, 60.24], [26.10, 63.67]]
        ]
    },
    {
        "id": "Cyg",
        "name": "Cygnus",
        "meaning": "The Swan (Northern Cross)",
        "ra": 308.0, "dec": 42.0,
        "lines": [
            # Long axis: Deneb -> Sadr -> Albireo
            [[310.36, 45.28], [305.56, 40.26]],
            [[305.56, 40.26], [292.68, 27.96]],
            # Wings: Gienah -> Sadr -> Delta Cygni
            [[311.54, 33.97], [305.56, 40.26]],
            [[305.56, 40.26], [296.24, 45.13]],
            # Wing tips
            [[311.54, 33.97], [320.33, 30.23]],
            [[296.24, 45.13], [292.42, 51.73]]
        ]
    },
    {
        "id": "Lyr",
        "name": "Lyra",
        "meaning": "The Lyre / Harp",
        "ra": 283.0, "dec": 36.0,
        "lines": [
            # Vega to Epsilon and Zeta
            [[279.23, 38.78], [281.08, 39.67]],
            [[279.23, 38.78], [281.20, 37.60]],
            # Parallelogram: Zeta -> Sheliak -> Sulafat -> Delta -> Zeta
            [[281.20, 37.60], [282.52, 33.36]],
            [[282.52, 33.36], [284.74, 32.69]],
            [[284.74, 32.69], [283.77, 36.90]],
            [[283.77, 36.90], [281.20, 37.60]]
        ]
    },
    {
        "id": "Aql",
        "name": "Aquila",
        "meaning": "The Eagle",
        "ra": 296.0, "dec": 3.0,
        "lines": [
            # Altair with Tarazed and Alshain
            [[297.70, 8.87], [295.38, 10.61]],
            [[297.70, 8.87], [298.83, 6.41]],
            # Body & Wings
            [[297.70, 8.87], [286.35, 13.86]],
            [[297.70, 8.87], [290.84, -4.88]],
            [[290.84, -4.88], [288.79, -1.97]]
        ]
    },
    {
        "id": "Tau",
        "name": "Taurus",
        "meaning": "The Bull",
        "ra": 68.0, "dec": 19.0,
        "lines": [
            # Hyades 'V': Aldebaran -> Theta -> Gamma -> Ain
            [[68.98, 16.51], [67.15, 15.63]],
            [[67.15, 15.63], [64.65, 15.63]],
            [[64.65, 15.63], [67.15, 19.18]],
            # Horns to Elnath and Tianguan
            [[68.98, 16.51], [84.41, 21.14]],
            [[67.15, 19.18], [81.57, 28.61]],
            # Pleiades connection hint
            [[64.65, 15.63], [56.87, 24.11]]
        ]
    },
    {
        "id": "Gem",
        "name": "Gemini",
        "meaning": "The Twins",
        "ra": 107.0, "dec": 25.0,
        "lines": [
            # Castor body: Castor -> Mebsuta -> Tejat -> Propus
            [[113.65, 31.89], [100.98, 25.13]],
            [[100.98, 25.13], [96.22, 22.51]],
            [[96.22, 22.51], [93.71, 22.51]],
            # Pollux body: Pollux -> Wasat -> Mekbuda -> Alhena
            [[116.17, 28.03], [110.03, 21.98]],
            [[110.03, 21.98], [106.02, 20.57]],
            [[106.02, 20.57], [99.43, 16.40]],
            # Connecting brothers
            [[113.65, 31.89], [116.17, 28.03]],
            [[100.98, 25.13], [110.03, 21.98]]
        ]
    },
    {
        "id": "Leo",
        "name": "Leo",
        "meaning": "The Lion",
        "ra": 160.0, "dec": 15.0,
        "lines": [
            # Sickle: Regulus -> Eta -> Algieba -> Adhafera -> Ras Elased -> Algenubi
            [[152.09, 11.97], [151.83, 16.76]],
            [[151.83, 16.76], [155.00, 19.84]],
            [[155.00, 19.84], [153.65, 23.42]],
            [[153.65, 23.42], [148.87, 26.01]],
            [[148.87, 26.01], [146.46, 23.77]],
            # Body: Algieba -> Zosma -> Chertan -> Regulus
            [[155.00, 19.84], [168.53, 20.52]],
            [[168.53, 20.52], [168.04, 15.43]],
            [[168.04, 15.43], [152.09, 11.97]],
            # Tail: Zosma -> Denebola -> Chertan
            [[168.53, 20.52], [177.26, 14.57]],
            [[177.26, 14.57], [168.04, 15.43]]
        ]
    },
    {
        "id": "Sco",
        "name": "Scorpius",
        "meaning": "The Scorpion",
        "ra": 250.0, "dec": -30.0,
        "lines": [
            # Head / Claws: Graffias -> Dschubba -> Pi Sco
            [[241.36, -19.80], [240.08, -22.62]],
            [[240.08, -22.62], [238.18, -26.11]],
            # Spine: Dschubba -> Antares -> Al Niyat -> Wei
            [[240.08, -22.62], [247.35, -26.43]],
            [[247.35, -26.43], [250.42, -28.22]],
            [[250.42, -28.22], [252.88, -34.29]],
            # Tail curl: Wei -> Larawag -> Sargas -> Shaula -> Lesath
            [[252.88, -34.29], [254.67, -37.30]],
            [[254.67, -37.30], [264.33, -43.00]],
            [[264.33, -43.00], [269.15, -39.03]],
            [[269.15, -39.03], [263.40, -37.10]],
            [[263.40, -37.10], [263.15, -37.29]]
        ]
    },
    {
        "id": "Boo",
        "name": "Bootes",
        "meaning": "The Herdsman (Kite shape)",
        "ra": 218.0, "dec": 30.0,
        "lines": [
            # Arcturus to Muphrid
            [[213.91, 19.18], [208.67, 18.39]],
            # Kite: Arcturus -> Izar -> Seginus -> Nekkar -> Delta -> Arcturus
            [[213.91, 19.18], [221.25, 27.07]],
            [[221.25, 27.07], [218.02, 38.31]],
            [[218.02, 38.31], [225.50, 40.39]],
            [[225.50, 40.39], [230.12, 33.31]],
            [[230.12, 33.31], [221.25, 27.07]],
            [[230.12, 33.31], [213.91, 19.18]]
        ]
    },
    {
        "id": "Peg",
        "name": "Pegasus",
        "meaning": "The Winged Horse (Great Square)",
        "ra": 345.0, "dec": 20.0,
        "lines": [
            # Great Square: Markab -> Scheat -> Alpheratz -> Algenib -> Markab
            [[346.19, 15.21], [345.94, 28.08]],
            [[345.94, 28.08], [2.10, 29.09]],
            [[2.10, 29.09], [3.31, 15.18]],
            [[3.31, 15.18], [346.19, 15.21]],
            # Neck & Head: Markab -> Homam -> Biham -> Enif
            [[346.19, 15.21], [340.33, 10.83]],
            [[340.33, 10.83], [333.33, 6.20]],
            [[333.33, 6.20], [326.05, 9.88]]
        ]
    },
    {
        "id": "And",
        "name": "Andromeda",
        "meaning": "The Chained Maiden",
        "ra": 10.0, "dec": 38.0,
        "lines": [
            # Alpheratz -> Delta -> Mirach -> Almach
            [[2.10, 29.09], [9.83, 30.86]],
            [[9.83, 30.86], [17.43, 35.62]],
            [[17.43, 35.62], [30.97, 42.33]],
            # Toward Andromeda Galaxy M31
            [[17.43, 35.62], [14.12, 40.50]]
        ]
    },
    {
        "id": "Cru",
        "name": "Crux",
        "meaning": "The Southern Cross",
        "ra": 188.0, "dec": -60.0,
        "lines": [
            # Acrux to Gacrux (long bar pointing to South Celestial Pole)
            [[186.65, -63.10], [187.79, -57.11]],
            # Mimosa to Imai (cross bar)
            [[191.93, -59.69], [183.84, -58.75]]
        ]
    },
    {
        "id": "CMa",
        "name": "Canis Major",
        "meaning": "The Great Dog",
        "ra": 103.0, "dec": -22.0,
        "lines": [
            # Sirius to Mirzam
            [[101.29, -16.72], [95.67, -17.96]],
            # Sirius to Muliphein
            [[101.29, -16.72], [103.54, -14.04]],
            # Sirius to Wezen to Adhara
            [[101.29, -16.72], [107.10, -26.39]],
            [[107.10, -26.39], [104.66, -28.97]],
            # Wezen to Aludra
            [[107.10, -26.39], [111.02, -29.30]]
        ]
    },
    {
        "id": "Vir",
        "name": "Virgo",
        "meaning": "The Maiden",
        "ra": 195.0, "dec": -5.0,
        "lines": [
            # Spica -> Porrima -> Vindemiatrix
            [[201.30, -11.16], [190.43, -1.45]],
            [[190.43, -1.45], [195.55, 10.96]],
            # Porrima -> Zaniah -> Zavijava
            [[190.43, -1.45], [185.00, -0.67]],
            [[185.00, -0.67], [176.38, 1.77]],
            # Spica -> Heze
            [[201.30, -11.16], [203.80, -0.67]]
        ]
    },
    {
        "id": "Per",
        "name": "Perseus",
        "meaning": "The Hero",
        "ra": 50.0, "dec": 45.0,
        "lines": [
            # Mirfak spine: Mirfak -> Gamma -> Eta
            [[51.08, 49.86], [45.89, 53.51]],
            [[45.89, 53.51], [42.75, 55.90]],
            # Algol branch: Mirfak -> Algol -> Gorgonea Tertia
            [[51.08, 49.86], [47.04, 40.96]],
            [[47.04, 40.96], [45.18, 38.85]],
            # Toward Auriga / Taurus: Mirfak -> Menkib
            [[51.08, 49.86], [58.89, 40.01]],
            [[58.89, 40.01], [60.50, 35.79]]
        ]
    },
    {
        "id": "Aur",
        "name": "Auriga",
        "meaning": "The Charioteer",
        "ra": 85.0, "dec": 42.0,
        "lines": [
            # Pentagon: Capella -> Menkalinan -> Theta -> Elnath -> Hassaleh -> Capella
            [[79.17, 46.00], [89.88, 44.95]],
            [[89.88, 44.95], [89.92, 37.21]],
            [[89.92, 37.21], [81.57, 28.61]],
            [[81.57, 28.61], [74.20, 33.17]],
            [[74.20, 33.17], [79.17, 46.00]]
        ]
    },
    {
        "id": "Sgr",
        "name": "Sagittarius",
        "meaning": "The Archer (The Teapot)",
        "ra": 285.0, "dec": -25.0,
        "lines": [
            # Teapot handle: Nunki -> Ascella -> Tau Sgr
            [[282.52, -26.30], [285.45, -29.88]],
            [[285.45, -29.88], [286.74, -27.67]],
            [[286.74, -27.67], [282.52, -26.30]],
            # Teapot base / bowl: Ascella -> Kaus Australis -> Kaus Media
            [[285.45, -29.88], [276.04, -34.39]],
            [[276.04, -34.39], [275.24, -29.83]],
            # Teapot lid / spout: Kaus Media -> Kaus Borealis -> Nunki
            [[275.24, -29.83], [276.99, -25.42]],
            [[276.99, -25.42], [282.52, -26.30]],
            # Spout tip: Kaus Media -> Alnasl
            [[275.24, -29.83], [271.45, -30.42]],
            [[271.45, -30.42], [276.99, -25.42]]
        ]
    }
]

def save_constellations():
    out_path = os.path.join("data", "constellations.json")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(CONSTELLATIONS, f, indent=2)
    print(f"Saved {len(CONSTELLATIONS)} constellations to {out_path}")

if __name__ == "__main__":
    save_constellations()
