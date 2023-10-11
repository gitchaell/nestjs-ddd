import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'
import { DddModule } from '@nestjslatam/ddd'

import { DevtoolsModule } from '@nestjs/devtools-integration'
import {
	MemberTable,
	ProjectRepository,
	ProjectTable,
} from './projects/infrastructure'
import {
	CreateProjectController,
	CreateProjectService,
	ProjectSaga,
} from './projects/application'
import { DomainEventHandlers } from './projects/domain'
import { SharedModule } from './shared/shared.module'

@Module({
	imports: [
		ConfigModule.forRoot(),
		DddModule,
		TypeOrmModule.forRootAsync({
			useFactory: () => ({
				type: 'postgres',
				host: process.env.DATABASE_HOST,
				port: parseInt(process.env.DATABASE_PORT),
				username: process.env.DATABASE_USER,
				password: process.env.DATABASE_PASSWORD,
				database: process.env.DATABASE_NAME,
				autoLoadEntities: true,
				synchronize: true, // disabled in production
			}),
		}),
		TypeOrmModule.forFeature([ProjectTable, MemberTable]),
		DevtoolsModule.register({
			http: process.env.NODE_ENV !== 'production',
		}),
		SharedModule,
	],
	controllers: [CreateProjectController],
	providers: [
		CreateProjectService,
		ProjectRepository,
		...DomainEventHandlers,
		ProjectSaga,
	],
})
export class AppModule {}
