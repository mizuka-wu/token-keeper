import { initializeDatabase } from '../init'
import * as db from '../db'

async function runTests() {
  console.log('🧪 Starting database tests...')
  
  try {
    // Initialize database
    console.log('📦 Initializing database...')
    await initializeDatabase()
    console.log('✅ Database initialized')

    // Test Group Operations
    console.log('\n📝 Testing Group Operations...')
    
    const group1 = await db.createGroup('AI Services', 'OpenAI, Claude, etc.')
    console.log('✅ Created group:', group1)
    
    const group2 = await db.createGroup('Cloud Services', 'AWS, GCP, etc.')
    console.log('✅ Created group:', group2)
    
    const groups = await db.getGroups()
    console.log('✅ Retrieved groups:', groups)

    // Test Token Operations
    console.log('\n🔑 Testing Token Operations...')
    
    const token1 = await db.createToken(
      'OpenAI API Key',
      'sk-proj-xxx',
      'OPENAI_API_KEY',
      'Main OpenAI API key',
      ['ai', 'openai'],
      'https://openai.com',
      '2025-12-31'
    )
    console.log('✅ Created token:', token1)
    
    const token2 = await db.createToken(
      'AWS Access Key',
      'AKIA...',
      'AWS_ACCESS_KEY_ID',
      'AWS production key',
      ['aws', 'cloud'],
      'https://aws.amazon.com'
    )
    console.log('✅ Created token:', token2)
    
    const tokens = await db.getTokens()
    console.log('✅ Retrieved tokens:', tokens)

    // Test Association
    console.log('\n🔗 Testing Group-Token Association...')
    
    await db.addTokenToGroup(group1.id, token1.id)
    console.log('✅ Added token1 to group1')
    
    await db.addTokenToGroup(group2.id, token2.id)
    console.log('✅ Added token2 to group2')
    
    const groupTokens = await db.getGroupTokens(group1.id)
    console.log('✅ Retrieved tokens for group1:', groupTokens)
    
    const tokenGroups = await db.getTokenGroups(token1.id)
    console.log('✅ Retrieved groups for token1:', tokenGroups)

    // Test Update
    console.log('\n✏️ Testing Update Operations...')
    
    const updatedToken = await db.updateToken(token1.id, {
      name: 'OpenAI API Key (Updated)',
      description: 'Updated description'
    })
    console.log('✅ Updated token:', updatedToken)

    // Test Search
    console.log('\n🔍 Testing Search...')
    
    const searchResults = await db.searchTokens('OpenAI')
    console.log('✅ Search results for "OpenAI":', searchResults)

    // Test Delete
    console.log('\n🗑️ Testing Delete Operations...')
    
    await db.removeTokenFromGroup(group1.id, token1.id)
    console.log('✅ Removed token1 from group1')
    
    console.log('\n✨ All tests passed!')
  } catch (error) {
    console.error('❌ Test failed:', error)
    process.exit(1)
  }
}

runTests()
