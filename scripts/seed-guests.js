const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

function randomToken() {
  return require('crypto').randomBytes(16).toString('base64url')
}

async function seed() {
  // 1. Ensure wedding exists
  const { data: wedding } = await supabase.from('weddings').select('id').single()
  let weddingId = wedding?.id
  if (!weddingId) {
    const { data } = await supabase.from('weddings').insert({
      couple_names: 'Arancha & Agonay',
      wedding_date: '2027-05-01',
      lifecycle_state: 'planning',
    }).select().single()
    weddingId = data.id
    console.log('Created wedding:', weddingId)
  } else {
    console.log('Wedding exists:', weddingId)
  }

  // 2. Create groups
  const groups = [
    { name: 'Familia Arancha', color: '#8B9A7C' },
    { name: 'Familia Agonay', color: '#C4795B' },
    { name: 'Amigos Alcazar', color: '#C9A96E' },
    { name: 'Amigos Gym', color: '#6B7B5C' },
    { name: 'Labo', color: '#8B9A7C' },
    { name: 'Utek', color: '#C4795B' },
    { name: 'Idaero', color: '#C9A96E' },
    { name: 'Amigos Extra', color: '#8B9A7C' },
    { name: 'Extras Familia', color: '#C4795B' },
    { name: 'Otros', color: '#A8A29E' },
  ]

  const groupIds = {}
  for (const g of groups) {
    const { data: existing } = await supabase
      .from('guest_groups')
      .select('id')
      .eq('wedding_id', weddingId)
      .eq('name', g.name)
      .single()

    if (existing) {
      groupIds[g.name] = existing.id
      console.log('Group exists:', g.name)
    } else {
      const { data } = await supabase
        .from('guest_groups')
        .insert({ wedding_id: weddingId, name: g.name, color: g.color })
        .select().single()
      groupIds[g.name] = data.id
      console.log('Created group:', g.name)
    }
  }

  // 3. Parse guests from the spreadsheet
  const guestData = {
    'Familia Arancha': [
      'Mama', 'Papa', 'Tamara', 'Fernando', 'Tio Jose', 'Tia Paloma',
      'Judit', 'Cardenas', 'Cristian', 'Silvia', 'Tio Juanjo', 'Tia Tere',
      'Jose Luis', 'Laura', 'Eva', 'Raquel', 'Carlos',
    ],
    'Extras Familia': [
      'Tia Josefina', 'Tio Joaquin', 'Pili', 'Luis', 'Maria del Mar',
      'Ireño', 'Upi', 'Merce', 'Miguel', 'Inma',
    ],
    'Amigos Alcazar': [
      'Valero', 'Ernesto', 'Mariajo', 'Ceci', 'Juani', 'Chato',
      'Arancha', 'Ortiz', 'Molinin', 'Angy', 'Yoli', 'Moyi',
    ],
    'Amigos Extra': [
      'Ayelen', 'Kiwi', 'Pablo', 'Gañan', 'Marta Mota',
    ],
    'Labo': [
      'Marta', 'Tania', 'Carla', 'Juanito', 'Natalia', 'Rodri',
      'Julia Polaca', 'Lucia', 'Gina', 'Noelia', 'Roi',
    ],
    'Otros': [
      'Andrea', 'Alicia', 'Celia', 'Maria', 'Cristina', 'Amelia',
      'Paula', 'Laura G', 'Marta O', 'David', 'Carmen', 'Ino',
      'Mª Carmen', 'Elena', 'Marido Familia Ago',
    ],
    'Familia Agonay': [
      'Mama A', 'Papa A', 'Manolo', 'Oma', 'Natalia A',
      'Tia Gladis', 'Tio Toñi',
    ],
    'Amigos Gym': [
      'Jorge', 'Nazi', 'Primo', 'Raclos', 'Cristabel', 'Miriam',
    ],
    'Utek': [
      'Jorge U', 'Pelayo', 'Mario', 'Elena U', 'Carlos U', 'Alex', 'Alvaro',
    ],
    'Idaero': [
      'Invitado Idaero 1', 'Invitado Idaero 2',
    ],
  }

  // Guests with +1 (based on TRUE column in spreadsheet)
  const plusOneGuests = new Set(['Gañan', 'Mario'])

  // 4. Insert guests and invitations
  for (const [groupName, names] of Object.entries(guestData)) {
    const groupId = groupIds[groupName]

    for (const name of names) {
      // Skip if guest already exists
      const { data: existing } = await supabase
        .from('guests')
        .select('id')
        .eq('wedding_id', weddingId)
        .eq('first_name', name)
        .eq('group_id', groupId)
        .single()

      if (existing) {
        console.log(`  Guest exists: ${name} (${groupName})`)
        continue
      }

      // Create guest
      const { data: guest } = await supabase
        .from('guests')
        .insert({
          wedding_id: weddingId,
          first_name: name,
          last_name: '',
          group_id: groupId,
        })
        .select().single()

      console.log(`  Created guest: ${name} (${groupName})`)

      // Create invitation
      const token = randomToken()
      const { data: invitation } = await supabase
        .from('invitations')
        .insert({ wedding_id: weddingId, token, status: 'pending' })
        .select().single()

      // Link guest to invitation
      await supabase
        .from('invitation_guests')
        .insert({
          invitation_id: invitation.id,
          guest_id: guest.id,
          is_primary: true,
        })

      console.log(`    Invitation created: /i/${token}`)
    }
  }

  console.log('\n✅ Seed complete!')

  // Count results
  const { count: totalGuests } = await supabase
    .from('guests')
    .select('*', { count: 'exact', head: true })
    .eq('wedding_id', weddingId)

  const { count: totalInvitations } = await supabase
    .from('invitations')
    .select('*', { count: 'exact', head: true })
    .eq('wedding_id', weddingId)

  console.log(`Total guests: ${totalGuests}`)
  console.log(`Total invitations: ${totalInvitations}`)
}

seed().catch(console.error)
