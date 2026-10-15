export interface AvatarOption {
  id: string;
  name: string;
  gender: 'male' | 'female';
  dataUri: string;
}

const toUri = (svg: string) => `data:image/svg+xml;utf8,${encodeURIComponent(svg.trim())}`;

export const AVATAR_OPTIONS: AvatarOption[] = [
  // --- MALE AVATARS ---
  {
    id: 'avatar-m-kai',
    name: 'Kai',
    gender: 'male',
    dataUri: toUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
        <circle cx="50" cy="50" r="48" fill="#181B20" stroke="#2B2F36" stroke-width="2"/>
        <!-- Torso & Hoodie -->
        <path d="M22 92 C24 72 36 68 50 68 C64 68 76 72 78 92 Z" fill="#202329"/>
        <path d="M38 72 L50 84 L62 72 Z" fill="#8FAF9A" opacity="0.9"/>
        <!-- Neck -->
        <path d="M43 60 L43 70 L57 70 L57 60 Z" fill="#CB8E58"/>
        <!-- Face -->
        <rect x="34" y="32" width="32" height="34" rx="14" fill="#DFA878"/>
        <!-- Ears -->
        <circle cx="33" cy="48" r="4" fill="#DFA878"/>
        <circle cx="67" cy="48" r="4" fill="#DFA878"/>
        <circle cx="67" cy="49" r="1.5" fill="#8FAF9A"/> <!-- stud earring -->
        <!-- Eyes & Brows -->
        <path d="M39 42 Q43 40 47 42" stroke="#1F2328" stroke-width="1.8" fill="none" stroke-linecap="round"/>
        <path d="M53 42 Q57 40 61 42" stroke="#1F2328" stroke-width="1.8" fill="none" stroke-linecap="round"/>
        <circle cx="43" cy="46" r="2" fill="#181B20"/>
        <circle cx="57" cy="46" r="2" fill="#181B20"/>
        <!-- Nose & Mouth -->
        <path d="M50 47 L48.5 52 L51.5 52" stroke="#B87B4C" stroke-width="1.2" fill="none" stroke-linecap="round"/>
        <path d="M46 57 Q50 60 54 57" stroke="#9E5D32" stroke-width="1.5" fill="none" stroke-linecap="round"/>
        <!-- Hair: Textured crop -->
        <path d="M32 35 C32 23 40 18 50 18 C60 18 68 23 68 35 C68 36 65 33 60 33 C53 33 50 31 46 32 C41 33 36 34 32 35 Z" fill="#1E2228"/>
        <path d="M32 34 L32 44 L35 38 Z" fill="#1E2228"/>
        <path d="M68 34 L68 44 L65 38 Z" fill="#1E2228"/>
      </svg>
    `),
  },
  {
    id: 'avatar-m-leo',
    name: 'Leo',
    gender: 'male',
    dataUri: toUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
        <circle cx="50" cy="50" r="48" fill="#181B20" stroke="#2B2F36" stroke-width="2"/>
        <!-- Torso & Turtleneck -->
        <path d="M22 92 C24 72 36 67 50 67 C64 67 76 72 78 92 Z" fill="#1F242C"/>
        <rect x="41" y="60" width="18" height="12" rx="4" fill="#282E37"/>
        <!-- Face -->
        <rect x="33" y="32" width="34" height="34" rx="15" fill="#4B2B18"/>
        <!-- Ears -->
        <circle cx="32" cy="48" r="4" fill="#4B2B18"/>
        <circle cx="68" cy="48" r="4" fill="#4B2B18"/>
        <!-- Eyes & Brows -->
        <path d="M38 41 Q43 39 47 41" stroke="#121417" stroke-width="2" fill="none" stroke-linecap="round"/>
        <path d="M53 41 Q57 39 62 41" stroke="#121417" stroke-width="2" fill="none" stroke-linecap="round"/>
        <circle cx="43" cy="46" r="2.2" fill="#100D0A"/>
        <circle cx="57" cy="46" r="2.2" fill="#100D0A"/>
        <!-- Nose & Smile -->
        <path d="M50 46 L47.5 53 L52.5 53" stroke="#331A0C" stroke-width="1.4" fill="none" stroke-linecap="round"/>
        <path d="M45 58 Q50 62 55 58" stroke="#F5F5F5" stroke-width="2" fill="none" stroke-linecap="round"/>
        <!-- Hair: Curly fade top -->
        <circle cx="40" cy="24" r="8" fill="#121417"/>
        <circle cx="50" cy="22" r="9" fill="#121417"/>
        <circle cx="60" cy="24" r="8" fill="#121417"/>
        <circle cx="34" cy="30" r="7" fill="#121417"/>
        <circle cx="66" cy="30" r="7" fill="#121417"/>
        <rect x="35" y="24" width="30" height="12" fill="#121417"/>
      </svg>
    `),
  },
  {
    id: 'avatar-m-arjun',
    name: 'Arjun',
    gender: 'male',
    dataUri: toUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
        <circle cx="50" cy="50" r="48" fill="#181B20" stroke="#2B2F36" stroke-width="2"/>
        <!-- Jacket & Sage collar -->
        <path d="M20 92 C22 72 34 68 50 68 C66 68 78 72 80 92 Z" fill="#181C22"/>
        <path d="M40 70 L50 82 L42 92 Z" fill="#8FAF9A"/>
        <path d="M60 70 L50 82 L58 92 Z" fill="#82B99A"/>
        <!-- Neck -->
        <path d="M43 60 L43 70 L57 70 L57 60 Z" fill="#9C6235"/>
        <!-- Face -->
        <rect x="34" y="32" width="32" height="34" rx="14" fill="#B97843"/>
        <!-- Beard -->
        <path d="M35 50 C35 63 42 66 50 66 C58 66 65 63 65 50 C65 55 58 63 50 63 C42 63 35 55 35 50 Z" fill="#1E2228"/>
        <path d="M45 54 Q50 56 55 54" stroke="#1E2228" stroke-width="2" fill="none" stroke-linecap="round"/>
        <!-- Eyes & Brows -->
        <path d="M39 41 Q43 38 47 41" stroke="#1E2228" stroke-width="2.2" fill="none" stroke-linecap="round"/>
        <path d="M53 41 Q57 38 61 41" stroke="#1E2228" stroke-width="2.2" fill="none" stroke-linecap="round"/>
        <circle cx="43" cy="45" r="2.2" fill="#181B20"/>
        <circle cx="57" cy="45" r="2.2" fill="#181B20"/>
        <!-- Nose -->
        <path d="M50 45 L48 51 L52 51" stroke="#874E25" stroke-width="1.4" fill="none" stroke-linecap="round"/>
        <!-- Hair: Pompadour quiff -->
        <path d="M31 35 C31 20 40 16 52 16 C63 16 68 22 68 34 C65 31 58 28 50 28 C42 28 35 32 31 35 Z" fill="#1A1E24"/>
        <path d="M31 34 L31 45 L34 38 Z" fill="#1A1E24"/>
        <path d="M69 34 L69 45 L66 38 Z" fill="#1A1E24"/>
      </svg>
    `),
  },
  {
    id: 'avatar-m-noah',
    name: 'Noah',
    gender: 'male',
    dataUri: toUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
        <circle cx="50" cy="50" r="48" fill="#181B20" stroke="#2B2F36" stroke-width="2"/>
        <!-- Sage crewneck -->
        <path d="M22 92 C24 72 36 67 50 67 C64 67 76 72 78 92 Z" fill="#3D4B42"/>
        <path d="M42 67 C42 71 58 71 58 67 Z" fill="#8FAF9A"/>
        <!-- Neck -->
        <path d="M43 60 L43 69 L57 69 L57 60 Z" fill="#D99B77"/>
        <!-- Face -->
        <rect x="34" y="32" width="32" height="34" rx="14" fill="#F0B892"/>
        <!-- Ears -->
        <circle cx="33" cy="48" r="4" fill="#F0B892"/>
        <circle cx="67" cy="48" r="4" fill="#F0B892"/>
        <!-- Eyes & Brows -->
        <path d="M39 41 Q43 39 47 41" stroke="#825C37" stroke-width="1.8" fill="none" stroke-linecap="round"/>
        <path d="M53 41 Q57 39 61 41" stroke="#825C37" stroke-width="1.8" fill="none" stroke-linecap="round"/>
        <circle cx="43" cy="46" r="2.2" fill="#203328"/>
        <circle cx="57" cy="46" r="2.2" fill="#203328"/>
        <!-- Nose & Mouth -->
        <path d="M50 47 L48 52 L52 52" stroke="#CA8A60" stroke-width="1.3" fill="none" stroke-linecap="round"/>
        <path d="M46 58 Q50 61 54 58" stroke="#A75D35" stroke-width="1.8" fill="none" stroke-linecap="round"/>
        <!-- Hair: Tousled wavy light brown/caramel -->
        <path d="M30 35 C30 21 38 17 50 17 C62 17 70 21 70 35 C66 30 62 27 54 27 C48 27 45 30 40 28 C36 30 32 33 30 35 Z" fill="#C2874D"/>
        <path d="M38 25 Q46 22 52 26" stroke="#DE9E5F" stroke-width="2.5" fill="none" stroke-linecap="round"/>
      </svg>
    `),
  },
  {
    id: 'avatar-m-marcus',
    name: 'Marcus',
    gender: 'male',
    dataUri: toUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
        <circle cx="50" cy="50" r="48" fill="#181B20" stroke="#2B2F36" stroke-width="2"/>
        <!-- Tee shirt -->
        <path d="M22 92 C24 72 36 68 50 68 C64 68 76 72 78 92 Z" fill="#272B33"/>
        <path d="M40 68 C40 73 60 73 60 68 Z" fill="#181B20"/>
        <!-- Neck -->
        <path d="M43 60 L43 70 L57 70 L57 60 Z" fill="#673516"/>
        <!-- Face -->
        <rect x="33" y="32" width="34" height="34" rx="14" fill="#7D4724"/>
        <!-- Ears -->
        <circle cx="32" cy="48" r="4" fill="#7D4724"/>
        <circle cx="68" cy="48" r="4" fill="#7D4724"/>
        <!-- Glasses -->
        <rect x="37" y="42" width="11" height="8" rx="2" fill="none" stroke="#8FAF9A" stroke-width="1.5"/>
        <rect x="52" y="42" width="11" height="8" rx="2" fill="none" stroke="#8FAF9A" stroke-width="1.5"/>
        <path d="M48 45 L52 45" stroke="#8FAF9A" stroke-width="1.5"/>
        <circle cx="42.5" cy="46" r="1.8" fill="#181B20"/>
        <circle cx="57.5" cy="46" r="1.8" fill="#181B20"/>
        <!-- Mouth -->
        <path d="M46 58 Q50 61 54 58" stroke="#F5F5F5" stroke-width="1.5" fill="none" stroke-linecap="round"/>
        <!-- Locs / twists -->
        <circle cx="34" cy="23" r="5" fill="#14171A"/>
        <circle cx="42" cy="20" r="5.5" fill="#14171A"/>
        <circle cx="50" cy="19" r="6" fill="#14171A"/>
        <circle cx="58" cy="20" r="5.5" fill="#14171A"/>
        <circle cx="66" cy="23" r="5" fill="#14171A"/>
        <path d="M30 33 L30 42" stroke="#14171A" stroke-width="4" stroke-linecap="round"/>
        <path d="M70 33 L70 42" stroke="#14171A" stroke-width="4" stroke-linecap="round"/>
      </svg>
    `),
  },
  {
    id: 'avatar-m-zayn',
    name: 'Zayn',
    gender: 'male',
    dataUri: toUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
        <circle cx="50" cy="50" r="48" fill="#181B20" stroke="#2B2F36" stroke-width="2"/>
        <!-- Bomber jacket -->
        <path d="M22 92 C24 72 36 68 50 68 C64 68 76 72 78 92 Z" fill="#252A30"/>
        <path d="M48 68 L48 92 L52 92 L52 68 Z" fill="#8FAF9A"/>
        <!-- Neck -->
        <path d="M43 60 L43 70 L57 70 L57 60 Z" fill="#B87B4C"/>
        <!-- Face -->
        <rect x="34" y="32" width="32" height="34" rx="14" fill="#CB8E58"/>
        <!-- Subtle Goatee -->
        <path d="M47 59 C47 64 53 64 53 59 Z" fill="#1B1E22"/>
        <!-- Eyes & Brows -->
        <path d="M39 41 L47 41" stroke="#1B1E22" stroke-width="2.4" stroke-linecap="round"/>
        <path d="M53 41 L61 41" stroke="#1B1E22" stroke-width="2.4" stroke-linecap="round"/>
        <circle cx="43" cy="46" r="2.2" fill="#181B20"/>
        <circle cx="57" cy="46" r="2.2" fill="#181B20"/>
        <!-- Nose -->
        <path d="M50 46 L48 52 L52 52" stroke="#9E5D32" stroke-width="1.3" fill="none" stroke-linecap="round"/>
        <!-- Hair: Crisp clean buzzcut -->
        <path d="M32 35 C32 24 38 20 50 20 C62 20 68 24 68 35 L68 37 C63 34 57 32 50 32 C43 32 37 34 32 37 Z" fill="#181A1F"/>
        <path d="M32 36 L32 44 L35 39 Z" fill="#181A1F"/>
        <path d="M68 36 L68 44 L65 39 Z" fill="#181A1F"/>
      </svg>
    `),
  },

  // --- FEMALE AVATARS ---
  {
    id: 'avatar-f-maya',
    name: 'Maya',
    gender: 'female',
    dataUri: toUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
        <circle cx="50" cy="50" r="48" fill="#181B20" stroke="#2B2F36" stroke-width="2"/>
        <!-- Top with sage necklace -->
        <path d="M22 92 C24 72 36 68 50 68 C64 68 76 72 78 92 Z" fill="#22262E"/>
        <path d="M42 68 C42 75 58 75 58 68 Z" fill="#181B20"/>
        <circle cx="50" cy="74" r="2.5" fill="#8FAF9A"/>
        <!-- Neck -->
        <path d="M44 58 L44 70 L56 70 L56 58 Z" fill="#D99B77"/>
        <!-- Face -->
        <rect x="34" y="32" width="32" height="32" rx="14" fill="#F0B892"/>
        <!-- Eyes & Brows -->
        <path d="M39 42 Q43 39 47 42" stroke="#2B1D14" stroke-width="1.6" fill="none" stroke-linecap="round"/>
        <path d="M53 42 Q57 39 61 42" stroke="#2B1D14" stroke-width="1.6" fill="none" stroke-linecap="round"/>
        <circle cx="43" cy="46" r="2" fill="#2B1D14"/>
        <circle cx="57" cy="46" r="2" fill="#2B1D14"/>
        <!-- Nose & Lips -->
        <path d="M50 48 L49 52 L51 52" stroke="#CB7D55" stroke-width="1.2" fill="none" stroke-linecap="round"/>
        <path d="M46 57 Q50 60 54 57" stroke="#D97A7A" stroke-width="2" fill="none" stroke-linecap="round"/>
        <!-- Sleek Bob with fringe -->
        <path d="M30 36 C30 20 40 16 50 16 C60 16 70 20 70 36 L72 56 C72 58 68 58 67 53 L67 36 C64 36 60 36 50 36 C40 36 36 36 33 36 L33 53 C32 58 28 58 28 56 Z" fill="#23272F"/>
        <!-- Earrings -->
        <circle cx="31" cy="50" r="1.8" fill="#8FAF9A"/>
        <circle cx="69" cy="50" r="1.8" fill="#8FAF9A"/>
      </svg>
    `),
  },
  {
    id: 'avatar-f-zoe',
    name: 'Zoe',
    gender: 'female',
    dataUri: toUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
        <circle cx="50" cy="50" r="48" fill="#181B20" stroke="#2B2F36" stroke-width="2"/>
        <!-- Afro Puff Bun with Sage Band -->
        <circle cx="50" cy="20" r="14" fill="#15171B"/>
        <rect x="42" y="27" width="16" height="4" rx="2" fill="#8FAF9A"/>
        <!-- Top -->
        <path d="M22 92 C24 72 36 68 50 68 C64 68 76 72 78 92 Z" fill="#2A303A"/>
        <!-- Neck -->
        <path d="M44 58 L44 70 L56 70 L56 58 Z" fill="#3D1E0E"/>
        <!-- Face -->
        <rect x="34" y="32" width="32" height="32" rx="14" fill="#4B2B18"/>
        <!-- Hoop earrings -->
        <circle cx="31" cy="49" r="3.5" fill="none" stroke="#8FAF9A" stroke-width="1.2"/>
        <circle cx="69" cy="49" r="3.5" fill="none" stroke="#8FAF9A" stroke-width="1.2"/>
        <!-- Eyes & Brows -->
        <path d="M38 41 Q43 38 47 41" stroke="#15171B" stroke-width="1.8" fill="none" stroke-linecap="round"/>
        <path d="M53 41 Q57 38 62 41" stroke="#15171B" stroke-width="1.8" fill="none" stroke-linecap="round"/>
        <circle cx="43" cy="46" r="2.2" fill="#15171B"/>
        <circle cx="57" cy="46" r="2.2" fill="#15171B"/>
        <!-- Nose & Lips -->
        <path d="M50 48 L48 53 L52 53" stroke="#2E170A" stroke-width="1.3" fill="none" stroke-linecap="round"/>
        <path d="M45 58 Q50 62 55 58" stroke="#8B4D3B" stroke-width="2.5" fill="none" stroke-linecap="round"/>
        <!-- Front hairline -->
        <path d="M34 35 C34 29 40 28 50 28 C60 28 66 29 66 35 Z" fill="#15171B"/>
      </svg>
    `),
  },
  {
    id: 'avatar-f-aria',
    name: 'Aria',
    gender: 'female',
    dataUri: toUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
        <circle cx="50" cy="50" r="48" fill="#181B20" stroke="#2B2F36" stroke-width="2"/>
        <!-- Hair behind shoulders -->
        <path d="M26 45 C26 75 32 85 36 90 L64 90 C68 85 74 75 74 45 Z" fill="#3D271D"/>
        <!-- Top -->
        <path d="M24 92 C26 72 36 68 50 68 C64 68 74 72 76 92 Z" fill="#1F242C"/>
        <!-- Neck -->
        <path d="M44 58 L44 70 L56 70 L56 58 Z" fill="#A86A3D"/>
        <!-- Face -->
        <rect x="34" y="32" width="32" height="32" rx="14" fill="#CB8E58"/>
        <!-- Eyes & Brows -->
        <path d="M39 41 Q43 38 47 41" stroke="#2E1A11" stroke-width="1.8" fill="none" stroke-linecap="round"/>
        <path d="M53 41 Q57 38 61 41" stroke="#2E1A11" stroke-width="1.8" fill="none" stroke-linecap="round"/>
        <circle cx="43" cy="45" r="2.2" fill="#2E1A11"/>
        <circle cx="57" cy="45" r="2.2" fill="#2E1A11"/>
        <!-- Nose & Lips -->
        <path d="M50 47 L49 52 L51 52" stroke="#9A562B" stroke-width="1.2" fill="none" stroke-linecap="round"/>
        <path d="M46 57 Q50 61 54 57" stroke="#A94848" stroke-width="2" fill="none" stroke-linecap="round"/>
        <!-- Hair: Long cascading waves in front -->
        <path d="M32 35 C32 20 40 16 50 16 C60 16 68 20 68 35 C68 45 66 58 64 68 C61 58 64 45 61 36 C57 32 52 32 50 34 C48 32 43 32 39 36 C36 45 39 58 36 68 C34 58 32 45 32 35 Z" fill="#4B3124"/>
      </svg>
    `),
  },
  {
    id: 'avatar-f-chloe',
    name: 'Chloe',
    gender: 'female',
    dataUri: toUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
        <circle cx="50" cy="50" r="48" fill="#181B20" stroke="#2B2F36" stroke-width="2"/>
        <!-- Cardigan -->
        <path d="M22 92 C24 72 36 68 50 68 C64 68 76 72 78 92 Z" fill="#2E3532"/>
        <path d="M45 68 L50 78 L55 68 Z" fill="#8FAF9A"/>
        <!-- Neck -->
        <path d="M44 58 L44 70 L56 70 L56 58 Z" fill="#ECC3A6"/>
        <!-- Face -->
        <rect x="34" y="32" width="32" height="32" rx="14" fill="#FDE2D2"/>
        <!-- Glasses -->
        <circle cx="43" cy="46" r="5" fill="none" stroke="#2B2F36" stroke-width="1.5"/>
        <circle cx="57" cy="46" r="5" fill="none" stroke="#2B2F36" stroke-width="1.5"/>
        <path d="M48 46 L52 46" stroke="#2B2F36" stroke-width="1.5"/>
        <circle cx="43" cy="46" r="1.8" fill="#1F2328"/>
        <circle cx="57" cy="46" r="1.8" fill="#1F2328"/>
        <!-- Lips -->
        <path d="M46 58 Q50 61 54 58" stroke="#D97A7A" stroke-width="1.8" fill="none" stroke-linecap="round"/>
        <!-- Modern Pixie cut with lilac/platinum accent -->
        <path d="M31 35 C31 20 40 17 50 17 C60 17 68 20 68 33 C64 30 58 27 50 28 C42 29 35 34 31 35 Z" fill="#9D89AC"/>
        <path d="M31 34 L31 46 L34 38 Z" fill="#9D89AC"/>
        <path d="M42 23 Q49 19 56 24" stroke="#B8A7C4" stroke-width="2" fill="none" stroke-linecap="round"/>
      </svg>
    `),
  },
  {
    id: 'avatar-f-ananya',
    name: 'Ananya',
    gender: 'female',
    dataUri: toUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
        <circle cx="50" cy="50" r="48" fill="#181B20" stroke="#2B2F36" stroke-width="2"/>
        <!-- High Ponytail Hair to the side -->
        <path d="M56 16 C68 14 78 24 74 44 C72 46 68 44 68 40 C70 28 64 22 56 20 Z" fill="#1A1D22"/>
        <circle cx="56" cy="18" r="3.5" fill="#8FAF9A"/> <!-- Sage hair band -->
        <!-- Top -->
        <path d="M22 92 C24 72 36 68 50 68 C64 68 76 72 78 92 Z" fill="#242831"/>
        <!-- Neck -->
        <path d="M44 58 L44 70 L56 70 L56 58 Z" fill="#9C6235"/>
        <!-- Face -->
        <rect x="34" y="32" width="32" height="32" rx="14" fill="#B97843"/>
        <!-- Nose stud -->
        <circle cx="48" cy="50" r="1" fill="#8FAF9A"/>
        <!-- Eyes & Brows -->
        <path d="M39 41 Q43 38 47 41" stroke="#1A1D22" stroke-width="2" fill="none" stroke-linecap="round"/>
        <path d="M53 41 Q57 38 61 41" stroke="#1A1D22" stroke-width="2" fill="none" stroke-linecap="round"/>
        <circle cx="43" cy="45" r="2.2" fill="#1A1D22"/>
        <circle cx="57" cy="45" r="2.2" fill="#1A1D22"/>
        <!-- Lips -->
        <path d="M46 57 Q50 61 54 57" stroke="#A84C38" stroke-width="2" fill="none" stroke-linecap="round"/>
        <!-- Hair pulled back -->
        <path d="M32 34 C32 21 40 17 52 17 C62 17 67 22 67 34 C64 31 58 29 50 29 C42 29 36 31 32 34 Z" fill="#1A1D22"/>
      </svg>
    `),
  },
  {
    id: 'avatar-f-elena',
    name: 'Elena',
    gender: 'female',
    dataUri: toUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
        <circle cx="50" cy="50" r="48" fill="#181B20" stroke="#2B2F36" stroke-width="2"/>
        <!-- Back hair -->
        <path d="M26 40 C24 65 28 85 34 90 L66 90 C72 85 76 65 74 40 Z" fill="#4A2E1B"/>
        <!-- Sage ribbed sweater -->
        <path d="M22 92 C24 72 36 68 50 68 C64 68 76 72 78 92 Z" fill="#3D4B42"/>
        <!-- Neck -->
        <path d="M44 58 L44 70 L56 70 L56 58 Z" fill="#ECC3A6"/>
        <!-- Face -->
        <rect x="34" y="32" width="32" height="32" rx="14" fill="#FCD7C4"/>
        <!-- Eyes & Brows -->
        <path d="M39 41 Q43 38 47 41" stroke="#362012" stroke-width="1.8" fill="none" stroke-linecap="round"/>
        <path d="M53 41 Q57 38 61 41" stroke="#362012" stroke-width="1.8" fill="none" stroke-linecap="round"/>
        <circle cx="43" cy="45" r="2.2" fill="#24342A"/>
        <circle cx="57" cy="45" r="2.2" fill="#24342A"/>
        <!-- Lips -->
        <path d="M46 57 Q50 61 54 57" stroke="#CE7373" stroke-width="2" fill="none" stroke-linecap="round"/>
        <!-- Soft wavy center-parted hair in front -->
        <path d="M32 34 C32 20 42 16 50 19 C58 16 68 20 68 34 C66 45 64 56 62 65 C60 55 62 42 58 35 C54 30 52 32 50 34 C48 32 46 30 42 35 C38 42 40 55 38 65 C36 56 34 45 32 34 Z" fill="#5A3A23"/>
      </svg>
    `),
  },
];
