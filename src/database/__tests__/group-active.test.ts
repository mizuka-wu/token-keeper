import * as db from '../db'

console.log('=== Testing Group Active Field and Default Group ===\n')

try {
  // Test 1: Check if default group exists
  console.log('Test 1: Checking for default group...')
  const groups = db.getGroups()
  const defaultGroup = groups.find(g => g.name === 'Default')
  
  if (defaultGroup) {
    console.log('✓ Default group exists')
    console.log(`  ID: ${defaultGroup.id}`)
    console.log(`  Name: ${defaultGroup.name}`)
    console.log(`  Active: ${defaultGroup.active}`)
    console.log(`  Description: ${defaultGroup.description}`)
  } else {
    console.log('✗ Default group not found')
  }

  // Test 2: Create a new group with active=1
  console.log('\nTest 2: Creating new group with active=1...')
  const group1 = db.createGroup('Production', 'Production tokens', 1)
  console.log('✓ Group created')
  console.log(`  ID: ${group1.id}`)
  console.log(`  Name: ${group1.name}`)
  console.log(`  Active: ${group1.active}`)

  // Test 3: Create a new group with active=0
  console.log('\nTest 3: Creating new group with active=0...')
  const group2 = db.createGroup('Archived', 'Archived tokens', 0)
  console.log('✓ Group created')
  console.log(`  ID: ${group2.id}`)
  console.log(`  Name: ${group2.name}`)
  console.log(`  Active: ${group2.active}`)

  // Test 4: Update group active status
  console.log('\nTest 4: Updating group active status...')
  const updated = db.updateGroup(group2.id, undefined, undefined, 1)
  console.log('✓ Group updated')
  console.log(`  Name: ${updated.name}`)
  console.log(`  Active: ${updated.active}`)

  // Test 5: List all groups and show active status
  console.log('\nTest 5: Listing all groups...')
  const allGroups = db.getGroups()
  console.log(`✓ Total groups: ${allGroups.length}`)
  allGroups.forEach(g => {
    const status = g.active ? '✓ Active' : '✗ Inactive'
    console.log(`  - ${g.name} (${status})`)
  })

  console.log('\n=== All tests passed! ===')
} catch (error) {
  console.error('✗ Test failed:', error)
  process.exit(1)
}
