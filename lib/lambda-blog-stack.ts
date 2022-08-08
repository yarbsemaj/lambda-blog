import { aws_dynamodb, Duration, Expiration, Stack, StackProps } from 'aws-cdk-lib';
import { CfnApiKey, CfnDataSource, CfnGraphQLApi, CfnGraphQLSchema, CfnResolver } from 'aws-cdk-lib/aws-appsync';
import { CfnUserPoolGroup, UserPool } from 'aws-cdk-lib/aws-cognito';
import { AttributeType, Table } from 'aws-cdk-lib/aws-dynamodb';
import { ManagedPolicy, Policy, PolicyStatement, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { Architecture, Code, Function, Runtime, StartingPosition } from 'aws-cdk-lib/aws-lambda';
import { DynamoEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';
import { Construct } from 'constructs';
import { readFileSync, readSync } from 'fs';
import { formatTemplate } from '../utils/appsync';

export class LambdaBlogStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    //Cognito
    const userPool = new UserPool(this, 'bloger-user-pool', {
      userPoolName: 'Bloggers',
      signInAliases: {
        username: true,
      }
    })

    const client = userPool.addClient('blog-client', {
      authFlows:{
        userPassword: true,
        userSrp: true
      }
    } );

    userPool.addDomain('blog-login-domain',{
      cognitoDomain:{
        domainPrefix:'yarbsemaj-blog'
      }
    })

    const userGroup = new CfnUserPoolGroup(this, 'bloger-user-group', {
      userPoolId: userPool.userPoolId,
      groupName: 'Bloggers',
      description: 'People who can edit a blog'
    })

    const api = new CfnGraphQLApi(this, 'blog-api', {
      name: "grahpql-blog",
      authenticationType: 'API_KEY',
      additionalAuthenticationProviders: [
        {
          authenticationType: 'AMAZON_COGNITO_USER_POOLS',
          userPoolConfig: {
            awsRegion: this.region,
            userPoolId: userPool.userPoolId
          }
        }
      ],
    })
    const schemaDefinition = readFileSync('graphql/schema.graphql').toString();
    const apiSchema = new CfnGraphQLSchema(this, 'blog-api-schema', {
      apiId: api.attrApiId,
      definition: schemaDefinition
    })

    const apiKey = new CfnApiKey(this, 'blog-api-key', {
      apiId: api.attrApiId,
      description: "main-key",
      expires: Expiration.after(Duration.days(365)).toEpoch()
    })


    //Dynamo table
    const postTable = new Table(this, 'blog-post-table', {
      tableName: 'blog-posts',
      readCapacity: 1,
      writeCapacity: 1,
      stream: aws_dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
      partitionKey: { name: 'id', type: AttributeType.STRING },
    })

    postTable.addGlobalSecondaryIndex({
      readCapacity: 4,
      writeCapacity: 1,
      indexName: 'status-createdDate-index',
      partitionKey: { name: 'status', type: AttributeType.STRING },
      sortKey: { name: 'createdDate', type: AttributeType.STRING },
    })

    const postTableRole = new Role(this, 'post-table-roll', {
      assumedBy: new ServicePrincipal('appsync.amazonaws.com')
    });

    postTableRole.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName('AmazonDynamoDBFullAccess'));

    const dynamoDataSource = new CfnDataSource(this, 'dynamo-data-source', {
      apiId: api.attrApiId,
      name: 'postTable',
      type: 'AMAZON_DYNAMODB',
      dynamoDbConfig: {
        tableName: postTable.tableName,
        awsRegion: this.region
      },
      serviceRoleArn: postTableRole.roleArn
    })

    //Lambda
    const cachelambda = new Function(this, 'clear-cache-lambda', {
      runtime: Runtime.NODEJS_16_X,
      handler: 'clearCache.handler',
      architecture: Architecture.ARM_64,
      code: Code.fromAsset('lambda'),
      functionName: 'clear-cache-lambda',
      environment: { 'CF_DISTRIBUTION_ID': 'E1Y4FI6WDGLYI0' }
    })

    cachelambda.addEventSource(new DynamoEventSource(postTable, { startingPosition: StartingPosition.LATEST }))

    cachelambda.role?.attachInlinePolicy(new Policy(this, 'clear-cache-lambda-policy', {
      statements: [new PolicyStatement({
        actions: ['cloudfront:ListDistributions', 'cloudfront:CreateInvalidation'],
        resources: ['*']
      })]
    }))

    //Resolvers
    const getPostResolver = new CfnResolver(this, 'get-post-resolver', {
      apiId: api.attrApiId,
      fieldName: 'getPost',
      typeName: 'Query',
      dataSourceName: dynamoDataSource.name,
      requestMappingTemplate: formatTemplate(readFileSync('resolvers/getPost.vtl').toString()),
      responseMappingTemplate: '$util.toJson($ctx.result)',
    })
    getPostResolver.addDependsOn(apiSchema);

    const newPostResolver = new CfnResolver(this, 'this-new-post-reolver', {
      apiId: api.attrApiId,
      fieldName: 'createPost',
      typeName: 'Mutation',
      dataSourceName: dynamoDataSource.name,
      requestMappingTemplate: formatTemplate(readFileSync('resolvers/newPost.vtl').toString()),
      responseMappingTemplate: '$util.toJson($ctx.result)',
    })
    newPostResolver.addDependsOn(apiSchema);

    const listAllPostsResolver = new CfnResolver(this, 'list-all-post-resolver', {
      apiId: api.attrApiId,
      fieldName: 'listAllPosts',
      typeName: 'Query',
      dataSourceName: dynamoDataSource.name,
      requestMappingTemplate: formatTemplate(`{
            "version": "2018-05-29",
            "operation": "Scan"
          }`),
      responseMappingTemplate: '$util.toJson($ctx.result.items)',
    })
    listAllPostsResolver.addDependsOn(apiSchema);

    const listPublishedPostsResolver = new CfnResolver(this, 'list-published-post-resolver', {
      apiId: api.attrApiId,
      fieldName: 'listPublishedPosts',
      typeName: 'Query',
      dataSourceName: dynamoDataSource.name,
      requestMappingTemplate: formatTemplate(readFileSync('resolvers/listPublishedPosts.vtl').toString()),
      responseMappingTemplate: '$util.toJson($ctx.result.items)',
    })
    listPublishedPostsResolver.addDependsOn(apiSchema);

    const removePostResolver = new CfnResolver(this, 'removed-post-resolver', {
      apiId: api.attrApiId,
      fieldName: 'removePost',
      typeName: 'Mutation',
      dataSourceName: dynamoDataSource.name,
      requestMappingTemplate: formatTemplate(readFileSync('resolvers/removePost.vtl').toString()),
      responseMappingTemplate: '$util.toJson($ctx.result)',
    })
    listPublishedPostsResolver.addDependsOn(removePostResolver);

    const updatePostResolver = new CfnResolver(this, 'update-post-resolver', {
      apiId: api.attrApiId,
      fieldName: 'updatePost',
      typeName: 'Mutation',
      dataSourceName: dynamoDataSource.name,
      requestMappingTemplate: formatTemplate(readFileSync('resolvers/updatePost.vtl').toString()),
      responseMappingTemplate: '$util.toJson($ctx.result)',
    })
    updatePostResolver.addDependsOn(removePostResolver);
  }
}
