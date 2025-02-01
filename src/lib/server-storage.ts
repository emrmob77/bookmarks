import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');

// Veri dizinini oluştur
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

export function getServerBookmarks() {
  try {
    const filePath = path.join(DATA_DIR, 'bookmarks.json');
    if (!fs.existsSync(filePath)) {
      return [];
    }
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Yer imleri okunurken hata:', error);
    return [];
  }
}

export function getServerUsers() {
  try {
    const filePath = path.join(DATA_DIR, 'users.json');
    if (!fs.existsSync(filePath)) {
      return [];
    }
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Kullanıcılar okunurken hata:', error);
    return [];
  }
}

// LocalStorage'daki verileri dosyaya kaydet
export function syncToFile(key: string, data: any) {
  try {
    const filePath = path.join(DATA_DIR, `${key}.json`);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error(`${key} kaydedilirken hata:`, error);
  }
} 