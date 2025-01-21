import tkinter as tk
from tkinter import ttk
from tkinter import messagebox, filedialog
from sku_fetcher import SKUFetcher
import pandas as pd

# Configuration de la base de données
db_config = {
    "driver": "{IBM i Access ODBC Driver}",
    "system": "192.128.0.1",
    "user": "fmeasson",
    "password": "beauzac",
    "database": "RDYDTA01"
}

class Application(tk.Tk):
    def __init__(self, fetcher):
        super().__init__()
        self.title("Système de Recherche SKU / Numéro d'Article")
        self.geometry("1300x800")  # Ajusté pour plus d'espace
        self.fetcher = fetcher
        self.create_widgets()
        self.data = pd.DataFrame()  # Pour stocker les données récupérées

    def create_widgets(self):
        # Label d'Entrée
        input_label = tk.Label(self, text="Entrez les SKU ou numéros d'articles (séparés par des virgules ou des nouvelles lignes) :")
        input_label.pack(pady=10)

        # Zone de Texte pour l'Entrée
        self.input_text = tk.Text(self, height=5)
        self.input_text.pack(fill=tk.X, padx=20, pady=5)

        # Cadre des Options
        options_frame = tk.Frame(self)
        options_frame.pack(pady=10)

        # Variable pour Stocker l'Option Sélectionnée
        self.search_type = tk.StringVar(value="SKU")

        # Radio Buttons pour Choisir entre SKU et Numéro d'Article
        sku_radio = tk.Radiobutton(options_frame, text="SKU", variable=self.search_type, value="SKU", command=self.toggle_company_entry)
        sku_radio.grid(row=0, column=0, padx=5, pady=5, sticky='w')

        art_radio = tk.Radiobutton(options_frame, text="Numéro d'Article", variable=self.search_type, value="Article", command=self.toggle_company_entry)
        art_radio.grid(row=0, column=1, padx=5, pady=5, sticky='w')

        # Champ pour Entrer le Numéro de Société (Visible uniquement si Numéro d'Article est Sélectionné)
        self.company_label = tk.Label(options_frame, text="Numéro de Société :")
        self.company_entry = tk.Entry(options_frame)
        self.company_label.grid(row=0, column=2, padx=5, pady=5, sticky='w')
        self.company_entry.grid(row=0, column=3, padx=5, pady=5, sticky='w')
        self.company_label.grid_remove()
        self.company_entry.grid_remove()

        # Cadre des Boutons
        buttons_frame = tk.Frame(self)
        buttons_frame.pack(pady=10)

        # Bouton pour Récupérer les Données
        fetch_button = tk.Button(buttons_frame, text="Récupérer les données", command=self.fetch_data)
        fetch_button.pack(side=tk.LEFT, padx=5)

        # Bouton pour Exporter vers Excel
        export_button = tk.Button(buttons_frame, text="Exporter vers Excel", command=self.export_to_excel)
        export_button.pack(side=tk.LEFT, padx=5)

        # Treeview pour Afficher les Données
        self.tree = ttk.Treeview(self, columns=("SKU", "Poids", "Longueur", "Largeur", "Hauteur", "Volume",
                                                "Stock Disponible", "Société", "Statut du Produit",
                                                "Numéro d'Article", "Libellé du Produit",
                                                "Libellé Long du Produit", "EAN du Produit",
                                                "Marque", "Nombre de colis par couche",
                                                "Nombre de couches par palette",
                                                "Quantité UC par palette calculée",
                                                "Nombre de colis par palette"),
                                 show='headings')
        # Définir les En-têtes
        for col in self.tree["columns"]:
            self.tree.heading(col, text=col)
            if col == "Nombre de colis par palette":
                self.tree.column(col, width=150, anchor=tk.CENTER)
            else:
                self.tree.column(col, width=100, anchor=tk.CENTER)
        # Ajouter une Barre de Défilement Verticale
        scrollbar = ttk.Scrollbar(self, orient=tk.VERTICAL, command=self.tree.yview)
        self.tree.configure(yscroll=scrollbar.set)
        scrollbar.pack(side=tk.RIGHT, fill=tk.Y)
        self.tree.pack(fill=tk.BOTH, expand=True, padx=20, pady=10)

    def toggle_company_entry(self):
        if self.search_type.get() == "Article":
            self.company_label.grid()
            self.company_entry.grid()
        else:
            self.company_label.grid_remove()
            self.company_entry.grid_remove()

    def fetch_data(self):
        # Récupérer le Texte d'Entrée
        input_text = self.input_text.get("1.0", tk.END)
        # Séparer par des virgules ou des nouvelles lignes
        entries = [entry.strip() for entry in input_text.replace(',', '\n').split('\n') if entry.strip()]
        if not entries:
            messagebox.showwarning("Avertissement", "Veuillez entrer au moins un SKU ou numéro d'article.")
            return

        # Déterminer le Type de Recherche
        search_type = self.search_type.get()
        company_number = None
        if search_type == "Article":
            company_number = self.company_entry.get().strip()
            if not company_number:
                messagebox.showwarning("Avertissement", "Veuillez entrer un Numéro de Société pour la recherche par Numéro d'Article.")
                return

        # Récupérer les Données
        results = self.fetcher.get_sku_data(entries, search_type, company_number)
        if not results:
            messagebox.showinfo("Information", "Aucune donnée trouvée pour les entrées fournies.")
            return

        # Vider le Treeview
        for item in self.tree.get_children():
            self.tree.delete(item)

        # Préparer les Données pour l'Affichage et l'Exportation
        data_list = []
        for entry, data in results.items():
            if data:
                row = {
                    "SKU": entry,
                    "Poids": float(data['weight']) if data['weight'] else None,
                    "Longueur": float(data['length']) if data['length'] else None,
                    "Largeur": float(data['width']) if data['width'] else None,
                    "Hauteur": float(data['height']) if data['height'] else None,
                    "Volume": float(data['volume']) if data['volume'] else None,
                    "Stock Disponible": float(data['stock_available']) if data['stock_available'] else None,
                    "Société": int(data['stock']) if data['stock'] else None,
                    "Statut du Produit": data['status'],
                    "Numéro d'Article": int(data['article']) if data['article'] else None,
                    "Libellé du Produit": data['description_1'].strip() if data['description_1'] else None,
                    "Libellé Long du Produit": data['description_2'].strip() if data['description_2'] else None,
                    "EAN du Produit": data['general_code'],
                    "Marque": data['brand'].strip() if data['brand'] else None,
                    "Nombre de colis par couche": int(data['paletization']['a2qtco']) if data['paletization'] and data['paletization']['a2qtco'] else None,
                    "Nombre de couches par palette": int(data['paletization']['a2qtcp']) if data['paletization'] and data['paletization']['a2qtcp'] else None,
                    "Quantité UC par palette calculée": int(data['paletization']['a2qtucp']) if data['paletization'] and data['paletization']['a2qtucp'] else None,
                    "Nombre de colis par palette": int(data['paletization']['a2qtcop']) if data['paletization'] and data['paletization']['a2qtcop'] else None
                }
                data_list.append(row)
                # Insérer dans le Treeview
                self.tree.insert("", tk.END, values=tuple(row.values()))
        # Convertir en DataFrame
        self.data = pd.DataFrame(data_list)
        messagebox.showinfo("Succès", "Données récupérées avec succès.")

    def export_to_excel(self):
        if self.data.empty:
            messagebox.showwarning("Avertissement", "Aucune donnée à exporter.")
            return
        # Demander à l'Utilisateur où Sauvegarder le Fichier
        file_path = filedialog.asksaveasfilename(defaultextension=".xlsx",
                                                 filetypes=[("Excel files", "*.xlsx"), ("All files", "*.*")])
        if not file_path:
            return
        try:
            self.data.to_excel(file_path, index=False)
            messagebox.showinfo("Succès", f"Données exportées avec succès vers {file_path}.")
        except Exception as e:
            messagebox.showerror("Erreur", f"Erreur lors de l'exportation des données : {e}")

if __name__ == "__main__":
    fetcher = SKUFetcher(db_config)
    app = Application(fetcher)
    app.mainloop()
