# Nuestra App

App personal + Row Energy, con **contraseña compartida** para que tú y tu esposa
vean y editen la misma información desde cualquier teléfono. Mismo esquema que
BabyTrack: **GitHub + Vercel + Supabase**.

Los datos de ejemplo ya se limpiaron: empieza en blanco.

---

## Cómo funciona la sincronización

- La primera vez, la app pide una **contraseña compartida**.
- Ambos escriben **exactamente la misma** contraseña → ven el mismo espacio de datos.
- Los datos se guardan en Supabase y se refrescan solos al abrir la app y cada 20 segundos.
- La contraseña se guarda en el teléfono, así que no hay que escribirla cada vez.
- Se cambia o cierra sesión desde el botón de engranaje (⚙️) arriba a la derecha.

> Seguridad: la protección es la contraseña. Elijan una larga y que solo ustedes
> conozcan (no la compartan). Nadie puede leer los datos sin esa contraseña.

---

## Pasos para subirla (una sola vez)

### 1) Supabase (base de datos)
1. Entra a https://supabase.com y crea un proyecto (plan gratuito).
2. En el menú lateral abre **SQL Editor → New query**.
3. Copia y pega **todo** el contenido de `supabase.sql` y pulsa **Run**.
4. Ve a **Project Settings → API** y copia dos valores:
   - **Project URL**
   - **anon public key**

### 2) GitHub (guardar el código)
1. Crea un repositorio nuevo en https://github.com (puede ser privado).
2. Sube esta carpeta al repositorio. Desde la terminal, dentro de la carpeta:
   ```bash
   git init
   git add .
   git commit -m "Nuestra App"
   git branch -M main
   git remote add origin https://github.com/TU-USUARIO/TU-REPO.git
   git push -u origin main
   ```
   (O usa GitHub Desktop si prefieres arrastrar y soltar.)

### 3) Vercel (publicar en internet)
1. Entra a https://vercel.com e inicia sesión con GitHub.
2. **Add New → Project** e importa tu repositorio.
3. Vercel detecta Vite solo. Antes de desplegar, abre **Environment Variables**
   y agrega estas dos (los valores del paso 1.4):
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Pulsa **Deploy**. Al terminar te da un enlace (algo como
   `https://nuestra-app.vercel.app`).

### 4) Instalar en el teléfono
1. Abre el enlace de Vercel en el teléfono (Chrome o Safari).
2. Menú del navegador → **Agregar a pantalla de inicio**.
3. Ábranla, escriban **la misma contraseña** en ambos teléfonos y listo.

---

## Probar en tu computadora (opcional)

```bash
npm install
cp .env.example .env      # y pega tus valores de Supabase dentro de .env
npm run dev
```
Abre la dirección que muestre la terminal (normalmente http://localhost:5173).

---

## Notas

- Para cambiar de espacio (empezar en blanco): engranaje → cerrar sesión, y entra
  con una contraseña distinta.
- Tailwind se carga por CDN para simplificar; funciona bien para uso personal.
- El manifest PWA no incluye íconos todavía; si quieres el ícono bonito en la
  pantalla de inicio, avísame y lo agregamos.
