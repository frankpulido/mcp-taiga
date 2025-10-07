# GITHUB/Taiga setup

# SETTING UP the integration

## How to set up Integration `GitHub->Taiga`

1. In Taiga Admin, go to **Integrations > GitHub (or Bitbucket/GitLab)**
2. Generate or copy the **secret key** and **payload URL**
3. In your Git repository, add a **webhook** pointing to the payload URL and add the secret key.
4. Set webhook events to listen to **push events**, **issues**, and **issue comments** as needed.
5. Now commits with messages formatted as described in section below will update task statuses automatically on Taiga.

### This method automates Taiga task status updates tied directly to your Git commit workflow — no manual Kanban updates needed.

# GIT commands

To integrate Git commits with Taiga Kanban statuses using commit message syntax, follow these instructions:

### Taiga Git Commit Syntax for Status Updates

In your **Git commit message**, include the task reference and status update like this.

```bash
git commit -m "commit_message TG-REF #STATUS-slug"
```

Example commit message that closes task TG-123:

```bash
git commit -m "Fixed login bug TG-123 #closed"
```

`TG-123` is your Taiga task/user story/issue ID

`#closed` is the new status to set on the task

In case the **git commit** doesn't change the status don't include the status tag

```bash
git commit -m "commit_message TG-REF"
```

### 

### Syntax for one commit affecting two tasks

Example commit message that is related to Task 123 and Task 321. The commit closes task TG-123 but does not change TG-321 status

```bash
git commit -m "Fixed login bug TG-123 #closed Completed Subscriber seeder TG-321"
```

`TG-123` is your Taiga task 123 : you have "`"Fixed login bug"`

`#closed` is the new status to set on the task TG-123

`TG-321` is your Taiga task 321 : you have “`Completed Subscriber seeder”`

The commit doesn't change `TG-321` status

## Common STATUS-slugs

| Status Name | Slug | Applies To |
| --- | --- | --- |
| New | new | All |
| In Progress | in-progress | All |
| Ready For Test | ready-for-test | All |
| Ready | ready | Epic, User Story |
| Done | done | Epic, User Story |
| Needs Info | needs-info | Epic, Task, Issue |
| Closed | closed | Task, Issue |
| Rejected | rejected | Issue |
| Postponed | postponed | Issue |

---

# ES : SETUP de la integración

## Cómo configurar la integración `GitHub→Taiga`

1. En el administrador de Taiga, ve a **Integraciones > GitHub (o Bitbucket/GitLab)**.
2. Genera o copia la **secret key** y la **payload** **URL**.
3. En tu repositorio de GitHub, añade un **webhook** que apunte a la **payload** **URL** y añade la **secret key**.
4. Configura los eventos del webhook para que escuchen **eventos push**, **issues** y **comentarios de issues** según sea necesario.
5. Ahora, los **commits** con mensajes con la sintaxis descrita en la sección a continuación actualizarán automáticamente los estados de las tareas en Taiga.

### Este sistema de trabajo actualiza de forma automática el estado de las Tareas del Taiga vinculándole directamente a través de la sintaxis de Git commit descrita a continuación — Esto hace innecesaria la actualización manual del Kanban.

# GIT : sintaxis de comandos

Para integrar los Git commits con los estados de Taiga Kanban usando la sintaxis del mensaje del commit siga las instrucciones a continuación :

### Taiga Git Commit Syntax for Status Updates

En el mensaje del **Git commit**, incluya la referencia a la tarea y la actualización de su estado de la siguiente forma :

```bash
git commit -m "commit_message TG-REF #STATUS-slug"
```

Ejemplo de commit cuyo mensaje “cierra” (closed) la tarea (task) TG-123 :

```bash
git commit -m "Fixed login bug TG-123 #closed"
```

`TG-123` identificador de Taiga para la `task || user story || issue ID`

`#closed` será el nuevo estado de la `task`

En caso de que el **git commit** no suponga el cambio de estado, sencillamente no incluimos el status tag

```bash
git commit -m "commit_message TG-REF"
```

### 

### Sintaxis a usar cuando 2 tareas están afectadas por un único commit

Ejemplo de commit con relacionado con la task 123 y la task 321. El commit “cierra” (closes) la task TG-123, pero no cambia el estado de la task TG-321.

```bash
git commit -m "Fixed login bug TG-123 #closed Completed Subscriber seeder TG-321"
```

`TG-123` es la Taiga task 123 : el mensaje para Taiga `"Fixed login bug"`

`#closed` es el nuevo estado de Kanban para la Taiga task TG-123

`TG-321` es la Taiga task 321 : el mensaje para Taiga `Completed Subscriber seeder”`

El commit no modifica el estado de la Taiga task `TG-321` 

## STATUS-slugs comunes

| Status Name | Slug | Applies To |
| --- | --- | --- |
| New | new | All |
| In Progress | in-progress | All |
| Ready For Test | ready-for-test | All |
| Ready | ready | Epic, User Story |
| Done | done | Epic, User Story |
| Needs Info | needs-info | Epic, Task, Issue |
| Closed | closed | Task, Issue |
| Rejected | rejected | Issue |
| Postponed | postponed | Issue |