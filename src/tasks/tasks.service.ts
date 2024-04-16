import { Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { TaskStatus } from './task-status.enum';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskStatusDto } from './dto/update-task-status.dto';
import { GetTasksFilterDto } from './dto/get-tasks-filter.dto';
import { TasksRepository } from './tasks.repository';
import { InjectRepository } from '@nestjs/typeorm';
import { Task } from './task.entity';
import { User } from 'src/auth/user.entity';

@Injectable()
export class TasksService {
    private readonly logger = new Logger('Tasks Service');

    constructor(
        @InjectRepository(Task)
        private readonly tasksRepository: TasksRepository
    ) {}

    async getTasks(filterDto: GetTasksFilterDto, user: User): Promise<Task[]> {
        const { status, search } = filterDto;
        const query = this.tasksRepository.createQueryBuilder('task');

        query.where({ user });

        if (status) {
            query.andWhere('task.status = :status', { status })
        }

        if (search) {
            query.andWhere('(LOWER(task.title) LIKE LOWER(:search) OR LOWER(task.description) LIKE LOWER(:search))', { search: `%${search}%` });
        }

        try {
            return await query.getMany();
        } catch (e) {
            this.logger.error(`Failed to fetch tasks for user ${user.username}. Filters: ${JSON.stringify(filterDto)}}`, e.stack);
            throw new InternalServerErrorException();
        }
    }

    async getTaskById(id: string, user: User): Promise<Task> {
        const found = await this.tasksRepository.findOne({
        where: {
            id, user
        }
    });

        if (!found) {
            throw new NotFoundException(`Task with id ${id} was not found`);
        }

        return found;
    }

    async deleteTaskById(id: string, user: User): Promise<void> {
        const res = await this.tasksRepository.delete({ id, user });
        if (res.affected === 0) {
            throw new NotFoundException(`Task with id ${id} was not found`);
        }
    }

    async updateTaskStatus(id: string, updateTaskStatusDto: UpdateTaskStatusDto, user: User): Promise<Task> {
        const { status } = updateTaskStatusDto;
        const taskToUpdate = await this.getTaskById(id, user);

        taskToUpdate.status = status;
        await this.tasksRepository.save(taskToUpdate);

        return taskToUpdate;
    }

    async createTask(createTaskDto: CreateTaskDto, user: User): Promise<Task> {
        const { title, description } = createTaskDto;
        const task: Task = this.tasksRepository.create({
            status: TaskStatus.OPEN,
            title,
            description,
            user,
        });

        await this.tasksRepository.save(task)

        return task;
    }
}
