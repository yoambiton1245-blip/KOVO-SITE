# KOVO – פרסום ב־Netlify

התיקייה הזאת היא האתר המלא, מוכן לפרסום ב־Netlify. לא צריך להתקין או לבנות כלום לפני ההעלאה.

```
public/               האתר עצמו (עמודים, עיצוב, תמונות, סרטון, קוד)
netlify/functions/    פונקציה ששומרת עיצובי מטבח ("שמירה וקישור")
netlify/lib/, shared/ קוד בדיקת נתונים משותף
netlify.toml          הגדרות: תיקיית האתר, כותרות אבטחה, מטמון
package.json          הספרייה שהפונקציה צריכה (@netlify/blobs)
```

## דרך 1 (מומלצת): חיבור ל־GitHub
כל התכונות עובדות, וכל עדכון ב־GitHub עולה לאתר לבד.

1. להעלות את התיקייה הזאת למאגר חדש ב־GitHub.
2. ב־Netlify: **Add new site > Import an existing project > GitHub**, ולבחור את המאגר.
3. ההגדרות נקראות מ־`netlify.toml`. משאירים הכל כמו שהוא ולוחצים **Deploy**.

## דרך 2: גרירה (Netlify Drop)
1. להיכנס ל־app.netlify.com > **Sites** > **Add new site > Deploy manually**.
2. לחלץ את ה־ZIP, ולגרור לחלון **רק את התיקייה `public`** שבתוכו (לא את ה־ZIP ולא את התיקייה הראשית).

בגרירה Netlify לא מפעיל פונקציות, ולכן "שמירה וקישור" במעצב המטבח לא ייצור קישור. כל השאר עובד, כולל טופס הפניות.

## לקבל את הפניות במייל (פעם אחת, אחרי הפרסום הראשון)
1. ב־Netlify: **Site configuration > Forms**, ולוודא ש־Form detection מופעל.
   אם הוא היה כבוי, מפעילים ומפרסמים שוב (Deploys > Trigger deploy).
2. **Forms > Form notifications > Add notification > Email notification**.
3. Event: **New form submission**, Form: **contact**, Email: `Kovo.kitchen@gmail.com`. שומרים.

מעכשיו כל פנייה מ"השאירו פרטים" מגיעה למייל, ונשמרת גם ב־Netlify תחת **Forms > contact**. פניות של בוטים מסוננות. לא צריך סיסמת Gmail.

## מה עובד ב־Netlify
| תכונה | Netlify |
|---|---|
| כל עמודי האתר, הגלריה, הסרטון, הסיפור, ההמלצות | עובד |
| וואטסאפ, טלפון, אינסטגרם | עובד |
| טופס "השאירו פרטים" + מייל | עובד (Netlify Forms) |
| עצב את המטבח: בחירות, לפני/אחרי, הורדת תמונה, שליחה בוואטסאפ | עובד |
| עצב את המטבח: "שמירה וקישור" | עובד בחיבור ל־GitHub, לא בגרירה |
| דף 404 | עובד |
| מערכת הניהול `/admin` | לא קיימת ב־Netlify. הפניות נמצאות בלוח של Netlify ובמייל |
| סטטיסטיקות כניסות ולחיצות | כבויות. אפשר להפעיל Netlify Analytics (בתשלום) או כלי אחר |

## דומיין
**Domain management > Add a domain** ולהוסיף את הדומיין (למשל kovo.co.il). Netlify נותן HTTPS בחינם.
אחרי שהדומיין מחובר, להחליף את `https://www.kovo.co.il/` בכתובת הסופית ב־`public/index.html`, `public/robots.txt` ו־`public/sitemap.xml`, אם היא שונה.

## עדכון האתר בהמשך
המקור הוא הפרויקט המלא (`kovo-fullstack`). אחרי שינוי שם מריצים:
`node tools/build-netlify.mjs` והתיקייה הזאת נבנית מחדש.
