"""Configuration pytest pour ajouter la racine au sys.path.

Sans ce fichier, pytest tests/seo échoue car l'import de scripts.seo.*
ne fonctionne que quand pytest est lancé avec -m (python3 -m pytest).

Ce fichier vide suffit à ce que pytest ajoute le répertoire courant à sys.path.
"""
