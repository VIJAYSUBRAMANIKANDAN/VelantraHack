// Minimal i18n: a flat key -> {lang: text} dictionary and a useT() hook
// that reads the active language from the zustand store. Not every string
// in the app is covered yet — this covers the highest-visibility screens
// (Welcome, Dashboard, nav, Voice Listing). Add more keys as you localize
// more screens; anything missing falls back to English automatically.
import { useStore } from '../store/useStore'

const DICT = {
  welcome_tagline:      { en: 'Speak. Sell. Grow.', ta: 'பேசு. விற்க. வளர்.', hi: 'बोलें। बेचें। बढ़ें।', te: 'మాట్లాడండి. అమ్మండి. ఎదగండి.', mr: 'बोला. विका. वाढा.' },
  create_account:       { en: 'Create an account', ta: 'கணக்கு உருவாக்கு', hi: 'खाता बनाएं', te: 'ఖాతా సృష్టించండి', mr: 'खाते तयार करा' },
  log_in:                { en: 'Log in', ta: 'உள்நுழை', hi: 'लॉग इन करें', te: 'లాగిన్ అవ్వండి', mr: 'लॉग इन करा' },
  continue_guest:        { en: 'Continue as guest', ta: 'விருந்தினராக தொடரவும்', hi: 'अतिथि के रूप में जारी रखें', te: 'అతిథిగా కొనసాగండి', mr: 'पाहुणे म्हणून सुरू ठेवा' },
  language_label:        { en: 'Language', ta: 'மொழி', hi: 'भाषा', te: 'భాష', mr: 'भाषा' },

  nav_home:              { en: 'Home', ta: 'முகப்பு', hi: 'होम', te: 'హోమ్', mr: 'होम' },
  nav_listings:          { en: 'My Listings', ta: 'எனது பட்டியல்கள்', hi: 'मेरी लिस्टिंग', te: 'నా లిస్టింగ్‌లు', mr: 'माझी यादी' },
  nav_speak:             { en: 'Speak', ta: 'பேசு', hi: 'बोलें', te: 'మాట్లాడండి', mr: 'बोला' },
  nav_orders:            { en: 'Orders', ta: 'ஆர்டர்கள்', hi: 'ऑर्डर', te: 'ఆర్డర్‌లు', mr: 'ऑर्डर' },
  nav_wallet:            { en: 'Wallet & Payments', ta: 'பணப்பை & பணம்', hi: 'वॉलेट और भुगतान', te: 'వాలెట్ & చెల్లింపులు', mr: 'वॉलेट आणि पेमेंट' },
  nav_insights:          { en: 'AI Insights', ta: 'AI நுண்ணறிவு', hi: 'AI जानकारी', te: 'AI అంతర్దృష్టులు', mr: 'AI माहिती' },
  nav_requests:          { en: 'Buyer Requests', ta: 'வாங்குபவர் கோரிக்கைகள்', hi: 'खरीदार अनुरोध', te: 'కొనుగోలుదారు అభ్యర్థనలు', mr: 'खरेदीदार विनंत्या' },
  nav_notifications:     { en: 'Notifications', ta: 'அறிவிப்புகள்', hi: 'सूचनाएं', te: 'నోటిఫికేషన్‌లు', mr: 'सूचना' },
  nav_support:           { en: 'Support', ta: 'ஆதரவு', hi: 'सहायता', te: 'మద్దతు', mr: 'सहाय्य' },
  nav_logout:            { en: 'Logout', ta: 'வெளியேறு', hi: 'लॉगआउट', te: 'లాగ్అవుట్', mr: 'लॉगआउट' },

  dashboard_title:       { en: 'Farmer Home Dashboard', ta: 'விவசாயி முகப்புப் பலகை', hi: 'किसान होम डैशबोर्ड', te: 'రైతు హోమ్ డాష్‌బోర్డ్', mr: 'शेतकरी होम डॅशबोर्ड' },
  welcome_back:          { en: 'Welcome', ta: 'வரவேற்பு', hi: 'स्वागत है', te: 'స్వాగతం', mr: 'स्वागत आहे' },
  active_listings:       { en: 'Active Listings', ta: 'செயலில் உள்ள பட்டியல்கள்', hi: 'सक्रिय लिस्टिंग', te: 'యాక్టివ్ లిస్టింగ్‌లు', mr: 'सक्रिय यादी' },
  total_earnings:        { en: 'Total Earnings', ta: 'மொத்த வருமானம்', hi: 'कुल कमाई', te: 'మొత్తం ఆదాయం', mr: 'एकूण कमाई' },
  wallet_balance:        { en: 'Wallet Balance', ta: 'பணப்பை இருப்பு', hi: 'वॉलेट बैलेंस', te: 'వాలెట్ బ్యాలెన్స్', mr: 'वॉलेट शिल्लक' },
  speak_new_listing:     { en: 'Speak New Listing (Voice AI)', ta: 'புதிய பட்டியலைப் பேசு', hi: 'नई लिस्टिंग बोलें', te: 'కొత్త లిస్టింగ్ మాట్లాడండి', mr: 'नवीन यादी बोला' },
  post_listing:          { en: 'Post Listing', ta: 'பட்டியலிடு', hi: 'लिस्टिंग पोस्ट करें', te: 'లిస్టింగ్ పోస్ట్ చేయండి', mr: 'यादी पोस्ट करा' },
  view_payments:         { en: 'View Payments', ta: 'பணம் காண்க', hi: 'भुगतान देखें', te: 'చెల్లింపులు చూడండి', mr: 'पेमेंट पहा' },
  ai_market_insights:    { en: 'AI Market Insights', ta: 'AI சந்தை நுண்ணறிவு', hi: 'AI बाजार जानकारी', te: 'AI మార్కెట్ అంతర్దృష్టులు', mr: 'AI बाजार माहिती' },
  todays_prices:         { en: "Today's market prices", ta: 'இன்றைய சந்தை விலைகள்', hi: 'आज के बाजार भाव', te: 'నేటి మార్కెట్ ధరలు', mr: 'आजचे बाजार भाव' },
  high_demand_crops:     { en: 'High demand crops', ta: 'அதிக தேவை பயிர்கள்', hi: 'उच्च मांग वाली फसलें', te: 'అధిక డిమాండ్ పంటలు', mr: 'जास्त मागणी असलेली पिके' },
  sell_now:              { en: 'SELL NOW', ta: 'இப்போது விற்கவும்', hi: 'अभी बेचें', te: 'ఇప్పుడే అమ్మండి', mr: 'आता विका' },

  mic_tap_to_speak:      { en: 'Tap to speak your listing', ta: 'பேச தட்டவும்', hi: 'बोलने के लिए टैप करें', te: 'మాట్లాడటానికి నొక్కండి', mr: 'बोलण्यासाठी टॅप करा' },
  mic_listening:         { en: 'Listening…', ta: 'கேட்கிறது…', hi: 'सुन रहा है…', te: 'వింటోంది…', mr: 'ऐकत आहे…' },
  mic_processing:        { en: 'Understanding what you said…', ta: 'நீங்கள் சொன்னதைப் புரிந்துகொள்கிறது…', hi: 'समझ रहा है…', te: 'అర్థం చేసుకుంటోంది…', mr: 'समजून घेत आहे…' },
  mic_permission_denied: { en: 'Microphone access was denied. Please allow it in your browser settings.', ta: 'மைக்ரோஃபோன் அணுகல் மறுக்கப்பட்டது.', hi: 'माइक्रोफ़ोन एक्सेस अस्वीकृत।', te: 'మైక్రోఫోన్ యాక్సెస్ నిరాకరించబడింది.', mr: 'मायक्रोफोन प्रवेश नाकारला.' },

  voice_page_title:      { en: 'New voice listing', ta: 'புதிய குரல் பட்டியல்', hi: 'नई वॉइस लिस्टिंग', te: 'కొత్త వాయిస్ లిస్టింగ్', mr: 'नवीन आवाज यादी' },
  we_heard:               { en: 'We heard:', ta: 'நாங்கள் கேட்டது:', hi: 'हमने सुना:', te: 'మేము విన్నది:', mr: 'आम्ही ऐकले:' },
  looks_right_continue:   { en: 'Looks right — continue', ta: 'சரியாக உள்ளது — தொடரவும்', hi: 'सही लग रहा है — जारी रखें', te: 'సరిగ్గా ఉంది — కొనసాగించండి', mr: 'बरोबर आहे — पुढे चला' },
  try_again:               { en: 'Try again', ta: 'மீண்டும் முயற்சி செய்', hi: 'फिर कोशिश करें', te: 'మళ్ళీ ప్రయత్నించండి', mr: 'पुन्हा प्रयत्न करा' },
  listening_speak_now:     { en: 'Listening — speak now', ta: 'கேட்கிறது — இப்போது பேசுங்கள்', hi: 'सुन रहा है — अब बोलें', te: 'వింటోంది — ఇప్పుడు మాట్లాడండి', mr: 'ऐकत आहे — आता बोला' },
  stop_auto_hint:          { en: "It'll stop automatically once you pause — or tap the mic to stop early", ta: 'நீங்கள் நிறுத்தும்போது தானாக நிற்கும் — அல்லது மைக்கைத் தட்டவும்', hi: 'रुकते ही यह अपने आप बंद हो जाएगा — या माइक टैप करें', te: 'మీరు ఆగినప్పుడు అదే ఆగిపోతుంది — లేదా మైక్‌ను నొక్కండి', mr: 'तुम्ही थांबताच ते आपोआप थांबेल — किंवा माइक टॅप करा' },
  voice_example_hint:      { en: 'Try: "I have 500 kg tomatoes in Salem. Expected 25 rupees per kg."', ta: 'இப்படி பேசுங்கள்: "எனக்கு சேலத்தில் 500 கிலோ தக்காளி உள்ளது. எதிர்பார்க்கும் விலை கிலோவுக்கு 25 ரூபாய்."', hi: 'ऐसे बोलें: "मेरे पास सेलम में 500 किलो टमाटर हैं। अपेक्षित मूल्य 25 रुपये प्रति किलो।"', te: 'ఇలా చెప్పండి: "నా వద్ద సేలంలో 500 కిలోల టమాటాలు ఉన్నాయి. ఆశించే ధర కిలోకి 25 రూపాయలు."', mr: 'असे बोला: "माझ्याकडे सेलममध्ये 500 किलो टोमॅटो आहेत. अपेक्षित किंमत 25 रुपये प्रति किलो."' },
  lang_accuracy_hint:      { en: 'Indian language recognition depends on your browser/OS — if it keeps mishearing you, try English or use "Type it instead" below.', ta: 'இந்திய மொழி அங்கீகாரம் உங்கள் உலாவி/OS-ஐ சார்ந்துள்ளது — தவறாகக் கேட்டால், ஆங்கிலத்தில் முயற்சிக்கவும் அல்லது கீழே "தட்டச்சு செய்க" பயன்படுத்தவும்.', hi: 'भारतीय भाषा पहचान आपके ब्राउज़र/OS पर निर्भर करती है — अगर गलत सुनाई दे तो अंग्रेज़ी आज़माएं या नीचे "टाइप करें" का उपयोग करें।', te: 'భారతీయ భాషా గుర్తింపు మీ బ్రౌజర్/OS పై ఆధారపడి ఉంటుంది — తప్పుగా వినిపిస్తే ఇంగ్లీష్ ప్రయత్నించండి లేదా కింద "టైప్ చేయండి" ఉపయోగించండి.', mr: 'भारतीय भाषा ओळख तुमच्या ब्राउझर/OS वर अवलंबून असते — चुकीचे ऐकू आल्यास इंग्रजी वापरून पहा किंवा खाली "टाइप करा" वापरा.' },
  speaking_in:             { en: 'Speaking in:', ta: 'பேசும் மொழி:', hi: 'बोलने की भाषा:', te: 'మాట్లాడే భాష:', mr: 'बोलण्याची भाषा:' },
  type_it_instead:         { en: 'Type it instead', ta: 'அதற்கு பதிலாக தட்டச்சு செய்', hi: 'इसके बजाय टाइप करें', te: 'బదులుగా టైప్ చేయండి', mr: 'त्याऐवजी टाइप करा' },
  browser_not_supported:   { en: "Your browser doesn't support voice recognition. Try Chrome, Edge, or Safari — or type your listing instead.", ta: 'உங்கள் உலாவி குரல் அங்கீகாரத்தை ஆதரிக்கவில்லை. Chrome, Edge அல்லது Safari-ஐ முயற்சிக்கவும் — அல்லது தட்டச்சு செய்யவும்.', hi: 'आपका ब्राउज़र वॉइस पहचान का समर्थन नहीं करता। Chrome, Edge या Safari आज़माएं — या टाइप करें।', te: 'మీ బ్రౌజర్ వాయిస్ గుర్తింపును సపోర్ట్ చేయదు. Chrome, Edge లేదా Safari ప్రయత్నించండి — లేదా టైప్ చేయండి.', mr: 'तुमचा ब्राउझर आवाज ओळख समर्थित करत नाही. Chrome, Edge किंवा Safari वापरून पहा — किंवा टाइप करा.' },
  no_speech_error:         { en: "Didn't catch anything — try speaking closer to the mic.", ta: 'எதுவும் கேட்கவில்லை — மைக்கிற்கு அருகில் பேசவும்.', hi: 'कुछ सुनाई नहीं दिया — माइक के पास बोलें।', te: 'ఏమీ వినిపించలేదు — మైక్‌కు దగ్గరగా మాట్లాడండి.', mr: 'काही ऐकू आले नाही — माइकजवळ बोला.' },
  generic_speech_error:    { en: 'Something went wrong with speech recognition. Try again.', ta: 'குரல் அங்கீகாரத்தில் ஏதோ தவறு நடந்தது. மீண்டும் முயற்சிக்கவும்.', hi: 'वॉइस पहचान में कुछ गड़बड़ हुई। फिर कोशिश करें।', te: 'వాయిస్ గుర్తింపులో ఏదో తప్పు జరిగింది. మళ్ళీ ప్రయత్నించండి.', mr: 'आवाज ओळखीत काहीतरी चूक झाली. पुन्हा प्रयत्न करा.' },
  no_speech_end_error:     { en: "Didn't catch anything — try again.", ta: 'எதுவும் கேட்கவில்லை — மீண்டும் முயற்சிக்கவும்.', hi: 'कुछ सुनाई नहीं दिया — फिर कोशिश करें।', te: 'ఏమీ వినిపించలేదు — మళ్ళీ ప్రయత్నించండి.', mr: 'काही ऐकू आले नाही — पुन्हा प्रयत्न करा.' },

  confirm_listing_title:   { en: 'Confirm listing', ta: 'பட்டியலை உறுதிப்படுத்து', hi: 'लिस्टिंग की पुष्टि करें', te: 'లిస్టింగ్‌ను నిర్ధారించండి', mr: 'यादीची पुष्टी करा' },
  field_crop:               { en: 'Crop', ta: 'பயிர்', hi: 'फसल', te: 'పంట', mr: 'पीक' },
  field_quality:            { en: 'Quality', ta: 'தரம்', hi: 'गुणवत्ता', te: 'నాణ్యత', mr: 'गुणवत्ता' },
  field_quantity_kg:        { en: 'Quantity (kg)', ta: 'அளவு (கிலோ)', hi: 'मात्रा (किलो)', te: 'పరిమాణం (కిలో)', mr: 'प्रमाण (किलो)' },
  field_expected_price:     { en: 'Expected price (₹/kg)', ta: 'எதிர்பார்க்கும் விலை (₹/கிலோ)', hi: 'अपेक्षित मूल्य (₹/किलो)', te: 'ఆశించే ధర (₹/కిలో)', mr: 'अपेक्षित किंमत (₹/किलो)' },
  field_location:           { en: 'Location', ta: 'இடம்', hi: 'स्थान', te: 'ప్రాంతం', mr: 'ठिकाण' },
  field_harvest_date:       { en: 'Harvest date', ta: 'அறுவடை தேதி', hi: 'फसल कटाई की तारीख', te: 'పంట తేదీ', mr: 'कापणी तारीख' },
  confirm_listing_btn:      { en: 'Confirm listing', ta: 'பட்டியலை உறுதிசெய்', hi: 'लिस्टिंग की पुष्टि करें', te: 'లిస్టింగ్‌ను నిర్ధారించండి', mr: 'यादीची पुष्टी करा' },
  edit_by_voice_again:      { en: 'Edit by voice again', ta: 'மீண்டும் குரலால் திருத்து', hi: 'फिर से वॉइस से संपादित करें', te: 'మళ్ళీ వాయిస్‌తో సవరించండి', mr: 'पुन्हा आवाजाने संपादित करा' },
  cancel:                   { en: 'Cancel', ta: 'ரத்துசெய்', hi: 'रद्द करें', te: 'రద్దు చేయండి', mr: 'रद्द करा' },
}

export function t(key, language) {
  return DICT[key]?.[language] ?? DICT[key]?.en ?? key
}

export function useT() {
  const language = useStore((s) => s.language)
  return (key) => t(key, language)
}
