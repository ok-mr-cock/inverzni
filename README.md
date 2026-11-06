# Třídní soutěž z matematiky (inverzní funkce)

Žáci otevřou odkaz v mobilu, zadají jméno a odpovídají na úlohy. Učitel řídí hru (spuštění, odhalení, další úloha) a vidí rozložení odpovědí. Body se počítají na serveru (správně + rychle = až 1000 bodů).

## Nasazení (GitHub + Render)

1. Na GitHubu založte nový repozitář a nahrajte do něj **obsah této složky včetně složky `public`** (Add file → Upload files, soubory přetáhněte najednou).
2. Na https://render.com zvolte **New → Web Service** a vyberte tento repozitář.
3. Nastavení: Runtime `Node`, Build Command `npm install`, Start Command `node server.js`, Instance Type `Free`.
4. V části **Environment** přidejte proměnnou `TEACHER_PIN` s vaším PINem (bez ní platí `1234`).
5. Po nasazení dostanete adresu `https://něco.onrender.com`.

Alternativa: **New → Blueprint** využije soubor `render.yaml`, PIN pak zadáte při vytvoření.

## Použití

- **Žáci:** `https://něco.onrender.com`
- **Učitel:** `https://něco.onrender.com/ucitel`, po zadání PINu uvidíte tlačítko pro spuštění.
- Na bezplatném tarifu Render po delší nečinnosti server uspí a první otevření trvá asi minutu. Stránku otevřete pár minut před hodinou.
- Stav hry je jen v paměti serveru. Po restartu nebo uspání se smaže.
- Tlačítko „Nová hra“ na konci smaže všechny hráče.

## Jak vyměnit úlohy

Úlohy jsou v souboru `public/ulohy.json` (pole objektů). Stačí soubor nahradit a nahrát na GitHub, Render se nasadí znovu.

Pole jedné úlohy:

| pole | význam |
|---|---|
| `lvl` | obtížnost 1 až 3 |
| `tema` | štítek nad úlohou |
| `zad` | zadání |
| `mc` | seznam 2 až 4 možností (A, B, C, D); u úloh ve stylu concept cartoon se místo toho zadají `n1`, `t1`, `n2`, `t2` (jména a výroky dvou postav) |
| `ans` | správná odpověď: u `mc` písmeno `A` až `D`, u postav `A`, `B`, `AB` (oba) nebo `N` (nikdo) |
| `res` | správný výsledek (ukáže se po odhalení) |
| `who` | v čem je chyba |
| `tip` | zkouška nebo tip |
| `plot` | nepovinné, graf: `{"f":"2*x-2","g":"..."}`, zápis ve výrazech JavaScriptu (`Math.sqrt(x)`, `x>=0?x*x:NaN`) |

Pozor: soubor `ulohy.json` je veřejný, zvídavý žák v něm může najít správné odpovědi.

## Lokální spuštění

```
npm install
TEACHER_PIN=1234 node server.js
```
Pak otevřete http://localhost:3000.
