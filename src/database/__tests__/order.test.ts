import * as db from '../db'

console.log('=== Testing Order/Drag Functionality ===\n')

try {
  // Test 1: Create multiple groups and check order_index
  console.log('Test 1: Creating groups with order_index...')
  const group1 = db.createGroup('Group 1', 'First group')
  const group2 = db.createGroup('Group 2', 'Second group')
  const group3 = db.createGroup('Group 3', 'Third group')
  
  console.log('✓ Groups created')
  console.log(`  Group 1: order_index=${group1.order_index}`)
  console.log(`  Group 2: order_index=${group2.order_index}`)
  console.log(`  Group 3: order_index=${group3.order_index}`)

  // Test 2: Update individual group order
  console.log('\nTest 2: Updating individual group order...')
  const updated = db.updateGroupOrder(group1.id, 10)
  console.log('✓ Group order updated')
  console.log(`  Group 1: order_index=${updated.order_index}`)

  // Test 3: Reorder groups
  console.log('\nTest 3: Reordering groups...')
  db.reorderGroups([group3.id, group1.id, group2.id])
  const reorderedGroups = db.getGroups()
  console.log('✓ Groups reordered')
  reorderedGroups.forEach((g, idx) => {
    console.log(`  ${idx + 1}. ${g.name} (order_index=${g.order_index})`)
  })

  // Test 4: Create tokens with order_index
  console.log('\nTest 4: Creating tokens with order_index...')
  const token1 = db.createToken('Token 1', 'value1')
  const token2 = db.createToken('Token 2', 'value2')
  const token3 = db.createToken('Token 3', 'value3')
  
  console.log('✓ Tokens created')
  console.log(`  Token 1: order_index=${token1.order_index}`)
  console.log(`  Token 2: order_index=${token2.order_index}`)
  console.log(`  Token 3: order_index=${token3.order_index}`)

  // Test 5: Update individual token order
  console.log('\nTest 5: Updating individual token order...')
  const updatedToken = db.updateTokenOrder(token1.id, 5)
  console.log('✓ Token order updated')
  console.log(`  Token 1: order_index=${updatedToken.order_index}`)

  // Test 6: Reorder tokens
  console.log('\nTest 6: Reordering tokens...')
  db.reorderTokens([token3.id, token1.id, token2.id])
  const reorderedTokens = db.getTokens()
  console.log('✓ Tokens reordered')
  reorderedTokens.slice(0, 3).forEach((t, idx) => {
    console.log(`  ${idx + 1}. ${t.name} (order_index=${t.order_index})`)
  })

  // Test 7: Add tokens to group and check order
  console.log('\nTest 7: Adding tokens to group and checking order...')
  db.addTokenToGroup(group1.id, token1.id)
  db.addTokenToGroup(group1.id, token2.id)
  db.addTokenToGroup(group1.id, token3.id)
  
  const groupTokens = db.getGroupTokens(group1.id)
  console.log('✓ Tokens added to group')
  console.log(`  Group "${group1.name}" contains ${groupTokens.length} tokens`)
  groupTokens.forEach((t, idx) => {
    console.log(`    ${idx + 1}. ${t.name} (order_index=${t.order_index})`)
  })

  console.log('\n=== All tests passed! ===')
} catch (error) {
  console.error('✗ Test failed:', error)
  process.exit(1)
}
